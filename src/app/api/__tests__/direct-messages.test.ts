import { NextRequest, NextResponse } from 'next/server';
import { GET as getConversations } from '../messages/route';
import { GET as getMessages, POST as sendMessage } from '../messages/[userId]/route';
import { PUT as markMessageRead } from '../messages/read/[messageId]/route';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/dbConnect';
import User from '@/models/User';
import DirectMessage from '@/models/DirectMessage';
// Mock mongoose
const mockObjectId = () => 'mock-id';
const mongoose = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  Types: {
    ObjectId: mockObjectId
  }
};
import { MongoMemoryServer } from 'mongodb-memory-server';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/dbConnect', () => jest.fn());

// Mock models
jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('@/models/DirectMessage', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
  aggregate: jest.fn(),
  populate: jest.fn(),
  save: jest.fn(),
}));

// Mock middleware
jest.mock('@/lib/apiUtils', () => ({
  withApiMiddleware: jest.fn((handler) => handler),
}));

jest.mock('@/middleware/rateLimit', () => ({
  rateLimit: jest.fn((req, res, next) => next()),
}));

jest.mock('@/lib/security', () => ({
  sanitizeInput: jest.fn(input => input),
}));

// Mock Redis
jest.mock('@/lib/redis', () => ({
  withCache: jest.fn((_, fn) => fn()),
  invalidateCache: jest.fn(),
  getRedis: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    scan: jest.fn().mockResolvedValue([0, []]),
  })),
}));

// Mock NextResponse.next
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      next: jest.fn(() => new originalModule.NextResponse()),
      json: jest.fn((data, options) => ({
        status: options?.status || 200,
        json: async () => data,
      })),
    },
  };
});

describe('Direct Messages API', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    // mongoose.connect is mocked
  });

  afterAll(async () => {
    // mongoose.disconnect is mocked
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth
    (auth as jest.Mock).mockResolvedValue({
      userId: 'test-clerk-id',
    });

    // Mock database connection
    (connectToDatabase as jest.Mock).mockResolvedValue(undefined);
  });

  describe('GET /api/messages', () => {
    it('should return 401 if not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue({
        userId: null,
      });

      const req = new NextRequest('http://localhost:3000/api/messages');
      const res = await getConversations(req);

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/messages');
      const res = await getConversations(req);

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'User not found' });
    });

    it('should return conversations', async () => {
      const mockUser = {
        _id: 'mock-user-id',
      };

      const mockConversations = [
        {
          userId: 'user1',
          username: 'user1',
          name: 'User 1',
          lastMessage: 'Hello',
          lastMessageAt: new Date(),
          unreadCount: 2,
        },
      ];

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (DirectMessage.aggregate as jest.Mock).mockResolvedValue(mockConversations);

      const req = new NextRequest('http://localhost:3000/api/messages');
      const res = await getConversations(req);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ conversations: mockConversations });
    });
  });

  describe('GET /api/messages/[userId]', () => {
    it('should return 401 if not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue({
        userId: null,
      });

      const req = new NextRequest('http://localhost:3000/api/messages/user1');
      const res = await getMessages(req, { params: { userId: 'user1' } });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/messages/user1');
      const res = await getMessages(req, { params: { userId: 'user1' } });

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'User not found' });
    });

    it('should return 404 if recipient not found', async () => {
      const mockUser = {
        _id: 'mock-user-id',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (User.findById as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/messages/user1');
      const res = await getMessages(req, { params: { userId: 'user1' } });

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'User not found' });
    });

    it('should return 403 if recipient does not allow messages', async () => {
      const mockUser = {
        _id: 'mock-user-id',
      };

      const mockRecipient = {
        _id: 'mock-recipient-id',
        privacySettings: {
          allowMessages: false,
        },
        toString: () => 'mock-recipient-id',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (User.findById as jest.Mock).mockResolvedValue(mockRecipient);

      const req = new NextRequest('http://localhost:3000/api/messages/user1');
      const res = await getMessages(req, { params: { userId: 'user1' } });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'This user does not allow direct messages' });
    });

    it('should return messages', async () => {
      const mockUser = {
        _id: 'mock-user-id',
      };

      const mockRecipient = {
        _id: 'mock-recipient-id',
        privacySettings: {
          allowMessages: true,
        },
        toString: () => 'mock-recipient-id',
      };

      const mockMessages = [
        {
          _id: 'mock-message-id',
          content: 'Hello',
          sender: {
            _id: mockUser._id,
            username: 'currentuser',
            name: 'Current User',
          },
          isRead: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (User.findById as jest.Mock).mockResolvedValue(mockRecipient);
      (DirectMessage.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockMessages),
              }),
            }),
          }),
        }),
      });
      (DirectMessage.countDocuments as jest.Mock).mockResolvedValue(1);

      const req = new NextRequest('http://localhost:3000/api/messages/user1');
      const res = await getMessages(req, { params: { userId: 'user1' } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.messages.length).toBe(1);
      expect(data.pagination.totalMessages).toBe(1);
    });
  });

  describe('POST /api/messages/[userId]', () => {
    it('should return 401 if not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue({
        userId: null,
      });

      const req = new NextRequest('http://localhost:3000/api/messages/user1', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Hello',
        }),
      });
      const res = await sendMessage(req, { params: { userId: 'user1' } });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if content is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/messages/user1', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await sendMessage(req, { params: { userId: 'user1' } });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Validation error');
    });

    it('should create a new message', async () => {
      const mockUser = {
        _id: 'mock-user-id',
      };

      const mockRecipient = {
        _id: 'mock-recipient-id',
        privacySettings: {
          allowMessages: true,
        },
        toString: () => 'mock-recipient-id',
      };

      const mockMessage = {
        _id: 'mock-message-id',
        content: 'Hello',
        sender: mockUser._id,
        recipient: mockRecipient._id,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        populate: jest.fn().mockResolvedValue({
          _id: 'mock-user-id',
          content: 'Hello',
          sender: {
            _id: mockUser._id,
            username: 'currentuser',
            name: 'Current User',
          },
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (User.findById as jest.Mock).mockResolvedValue(mockRecipient);
      (DirectMessage.create as jest.Mock).mockResolvedValue(mockMessage);

      const req = new NextRequest('http://localhost:3000/api/messages/user1', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Hello',
        }),
      });
      const res = await sendMessage(req, { params: { userId: 'user1' } });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.message).toBeDefined();
    });
  });

  describe('PUT /api/messages/read/[messageId]', () => {
    it('should return 401 if not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue({
        userId: null,
      });

      const req = new NextRequest('http://localhost:3000/api/messages/read/message1', {
        method: 'PUT',
      });
      const res = await markMessageRead(req, { params: { messageId: 'message1' } });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if message not found', async () => {
      const mockUser = {
        _id: 'mock-user-id',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (DirectMessage.findById as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/messages/read/message1', {
        method: 'PUT',
      });
      const res = await markMessageRead(req, { params: { messageId: 'message1' } });

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'Message not found' });
    });

    it('should return 403 if user is not the recipient', async () => {
      const mockUser = {
        _id: 'mock-user-id',
      };

      const mockMessage = {
        recipient: 'mock-other-id',
        toString: () => 'mock-message-id',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (DirectMessage.findById as jest.Mock).mockResolvedValue(mockMessage);

      const req = new NextRequest('http://localhost:3000/api/messages/read/message1', {
        method: 'PUT',
      });
      const res = await markMessageRead(req, { params: { messageId: 'message1' } });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'You can only mark messages sent to you as read' });
    });

    it('should mark message as read', async () => {
      const mockUser = {
        _id: 'mock-user-id',
      };

      const mockMessage = {
        _id: 'mock-message-id',
        recipient: mockUser._id,
        sender: 'mock-sender-id',
        toString: () => 'mock-message-id',
        isRead: false,
        save: jest.fn().mockResolvedValue(undefined),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (DirectMessage.findById as jest.Mock).mockResolvedValue(mockMessage);

      const req = new NextRequest('http://localhost:3000/api/messages/read/message1', {
        method: 'PUT',
      });
      const res = await markMessageRead(req, { params: { messageId: 'message1' } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message.isRead).toBe(true);
      expect(mockMessage.save).toHaveBeenCalled();
    });
  });
});
