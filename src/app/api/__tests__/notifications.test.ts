import { NextRequest } from 'next/server';
import { GET } from '../notifications/route';
import { PUT as MarkAllRead } from '../notifications/read-all/route';
import { PUT as MarkRead } from '../notifications/[notificationId]/read/route';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/dbConnect';
import User from '@/models/User';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/dbConnect', () => jest.fn());

// Mock models
jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
}));

jest.mock('@/models/Notification', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
}));

// Mock mongoose
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn(),
    },
  },
}));

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should return user notifications', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });
      
      // Mock database connection
      (connectToDatabase as jest.Mock).mockResolvedValue(undefined);
      
      // Mock User.findOne
      (User.findOne as jest.Mock).mockResolvedValue({ 
        _id: 'user123',
        clerkId: 'clerk123',
      });
      
      // Mock Notification.find
      (Notification.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'notification1',
            recipient: 'user123',
            sender: {
              _id: 'user456',
              username: 'sender',
              name: 'Sender User',
              image: 'sender.jpg',
            },
            type: 'comment',
            message: 'commented on your post',
            read: false,
            relatedPost: {
              _id: 'post123',
              content: 'Test post content',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      });
      
      // Mock Notification.countDocuments
      (Notification.countDocuments as jest.Mock).mockResolvedValue(1);
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/notifications');
      
      // Call the handler
      const response = await GET(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.notifications).toBeDefined();
      expect(data.notifications.length).toBe(1);
      expect(data.unreadCount).toBe(1);
      expect(data.pagination).toBeDefined();
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });
      
      // Mock database connection
      (connectToDatabase as jest.Mock).mockResolvedValue(undefined);
      
      // Mock User.findOne
      (User.findOne as jest.Mock).mockResolvedValue({ 
        _id: 'user123',
        clerkId: 'clerk123',
      });
      
      // Mock Notification.updateMany
      (Notification.updateMany as jest.Mock).mockResolvedValue({
        modifiedCount: 5,
      });
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/notifications/read-all', {
        method: 'PUT',
      });
      
      // Call the handler
      const response = await MarkAllRead(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(5);
    });
  });

  describe('PUT /api/notifications/[notificationId]/read', () => {
    it('should mark a notification as read', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });
      
      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      
      // Mock database connection
      (connectToDatabase as jest.Mock).mockResolvedValue(undefined);
      
      // Mock User.findOne
      (User.findOne as jest.Mock).mockResolvedValue({ 
        _id: 'user123',
        clerkId: 'clerk123',
      });
      
      // Mock Notification.findById
      (Notification.findById as jest.Mock).mockResolvedValue({
        _id: 'notification1',
        recipient: {
          toString: () => 'user123',
        },
        read: false,
        save: jest.fn().mockResolvedValue(true),
      });
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/notifications/notification1/read', {
        method: 'PUT',
      });
      
      // Call the handler
      const response = await MarkRead(request, { params: { notificationId: 'notification1' } });
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
