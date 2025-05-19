// Mock Next.js modules before importing them
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextRequest: jest.fn().mockImplementation((url, init) => ({
      url,
      method: init?.method || 'GET',
      headers: new Map(Object.entries(init?.headers || {})),
      json: jest.fn().mockImplementation(() => Promise.resolve(init?.body ? JSON.parse(init.body) : {})),
      nextUrl: { searchParams: new URLSearchParams() }
    })),
    NextResponse: {
      json: jest.fn().mockImplementation((data, init) => ({
        status: init?.status || 200,
        json: () => Promise.resolve(data),
        headers: new Map()
      })),
    },
  };
});

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../communities/route';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/dbConnect';
import User from '@/models/User';
import Community from '@/models/Community';
import Membership from '@/models/Membership';
import { generateUniqueSlug } from '@/lib/utils';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/dbConnect', () => jest.fn());

// Mock models
jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
}));

jest.mock('@/models/Community', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('@/models/Membership', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  generateUniqueSlug: jest.fn(),
}));

describe('Communities API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default auth mock
    (auth as jest.Mock).mockResolvedValue({
      userId: 'user_123',
    });

    // Setup default database connection mock
    (connectToDatabase as jest.Mock).mockResolvedValue(undefined);
  });

  describe('GET /api/communities', () => {
    it('should return communities with pagination', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities?page=1&limit=10&sort=recent');

      // Mock Community.countDocuments
      (Community.countDocuments as jest.Mock).mockResolvedValue(2);

      // Mock Community.find
      (Community.find as jest.Mock).mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'community1',
            name: 'Community One',
            slug: 'community-one',
            description: 'First community',
            image: 'https://example.com/community1.jpg',
            creator: {
              _id: 'creator1',
              username: 'creator1',
              name: 'Creator One',
              image: 'https://example.com/creator1.jpg',
            },
            members: ['member1', 'member2'],
            moderators: ['creator1'],
            posts: ['post1', 'post2'],
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01'),
          },
          {
            _id: 'community2',
            name: 'Community Two',
            slug: 'community-two',
            description: 'Second community',
            image: 'https://example.com/community2.jpg',
            creator: {
              _id: 'creator2',
              username: 'creator2',
              name: 'Creator Two',
              image: 'https://example.com/creator2.jpg',
            },
            members: ['member3'],
            moderators: ['creator2'],
            posts: [],
            createdAt: new Date('2023-01-02'),
            updatedAt: new Date('2023-01-02'),
          },
        ]),
      }));

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
      });

      // Mock Membership.find to check user memberships
      (Membership.find as jest.Mock).mockResolvedValue([
        { community: 'community1', status: 'ACTIVE' },
      ]);

      const response = await GET(req);

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('communities');
      expect(responseData).toHaveProperty('pagination');
      expect(responseData.communities).toHaveLength(2);

      // Check first community (user is a member)
      expect(responseData.communities[0]).toEqual({
        id: 'community1',
        name: 'Community One',
        slug: 'community-one',
        description: 'First community',
        image: 'https://example.com/community1.jpg',
        creator: {
          id: 'creator1',
          username: 'creator1',
          name: 'Creator One',
          image: 'https://example.com/creator1.jpg',
        },
        memberCount: 2,
        postCount: 2,
        isMember: true,
        isCreator: false,
        isModerator: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Check second community (user is not a member)
      expect(responseData.communities[1]).toEqual({
        id: 'community2',
        name: 'Community Two',
        slug: 'community-two',
        description: 'Second community',
        image: 'https://example.com/community2.jpg',
        creator: {
          id: 'creator2',
          username: 'creator2',
          name: 'Creator Two',
          image: 'https://example.com/creator2.jpg',
        },
        memberCount: 1,
        postCount: 0,
        isMember: false,
        isCreator: false,
        isModerator: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Check pagination
      expect(responseData.pagination).toEqual({
        page: 1,
        limit: 10,
        totalCommunities: 2,
        hasMore: false,
      });
    });

    it('should handle search query parameter', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities?search=test');

      // Mock Community.countDocuments with search
      (Community.countDocuments as jest.Mock).mockImplementation((query) => {
        expect(query.name.$regex).toBe('test');
        expect(query.name.$options).toBe('i');
        return Promise.resolve(1);
      });

      // Mock Community.find with search
      (Community.find as jest.Mock).mockImplementation((query) => {
        expect(query.name.$regex).toBe('test');
        expect(query.name.$options).toBe('i');
        return {
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            {
              _id: 'community1',
              name: 'Test Community',
              slug: 'test-community',
              description: 'A test community',
              creator: {
                _id: 'creator1',
                username: 'creator1',
                name: 'Creator One',
              },
              members: ['member1'],
              moderators: ['creator1'],
              posts: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        };
      });

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
      });

      // Mock Membership.find to check user memberships
      (Membership.find as jest.Mock).mockResolvedValue([]);

      const response = await GET(req);

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.communities).toHaveLength(1);
      expect(responseData.communities[0].name).toBe('Test Community');
    });
  });

  describe('POST /api/communities', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      (auth as jest.Mock).mockResolvedValue({ userId: null });

      const req = new NextRequest('http://localhost:3000/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Community',
          description: 'A new community',
        }),
      });

      const response = await POST(req);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if name or description is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Community',
          // Missing description
        }),
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Name and description are required' });
    });

    it('should return 404 if user is not found', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Community',
          description: 'A new community',
        }),
      });

      // Mock User.findOne to return null
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const response = await POST(req);

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Creator user not found' });
    });

    it('should return 400 if community name already exists', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Existing Community',
          description: 'A new community',
        }),
      });

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
      });

      // Mock Community.findOne to return an existing community
      (Community.findOne as jest.Mock).mockResolvedValue({
        _id: 'existing_community',
        name: 'Existing Community',
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Community name already exists' });
    });

    it('should successfully create a community', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Community',
          description: 'A new community',
          image: 'https://example.com/community.jpg',
        }),
      });

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
        name: 'Test User',
        image: 'https://example.com/user.jpg',
      });

      // Mock Community.findOne to return null (no existing community)
      (Community.findOne as jest.Mock).mockResolvedValue(null);

      // Mock generateUniqueSlug
      (generateUniqueSlug as jest.Mock).mockResolvedValue('new-community');

      // Mock Community.create
      (Community.create as jest.Mock).mockResolvedValue({
        _id: 'new_community_id',
        name: 'New Community',
        slug: 'new-community',
        description: 'A new community',
        image: 'https://example.com/community.jpg',
        creator: 'user_db_id',
        members: ['user_db_id'],
        moderators: ['user_db_id'],
        posts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        populate: jest.fn().mockResolvedValue({
          _id: 'new_community_id',
          name: 'New Community',
          slug: 'new-community',
          description: 'A new community',
          image: 'https://example.com/community.jpg',
          creator: {
            _id: 'user_db_id',
            username: 'testuser',
            name: 'Test User',
            image: 'https://example.com/user.jpg',
          },
          members: ['user_db_id'],
          moderators: ['user_db_id'],
          posts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      const response = await POST(req);

      expect(response.status).toBe(201);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('community');
      expect(responseData.community).toEqual({
        id: 'new_community_id',
        name: 'New Community',
        slug: 'new-community',
        description: 'A new community',
        image: 'https://example.com/community.jpg',
        creator: {
          id: 'user_db_id',
          username: 'testuser',
          name: 'Test User',
          image: 'https://example.com/user.jpg',
        },
        memberCount: 1,
        postCount: 0,
        isMember: true,
        isCreator: true,
        isModerator: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify Community.create was called with correct parameters
      expect(Community.create).toHaveBeenCalledWith({
        name: 'New Community',
        slug: 'new-community',
        description: 'A new community',
        image: 'https://example.com/community.jpg',
        creator: 'user_db_id',
        members: ['user_db_id'],
        moderators: ['user_db_id'],
        posts: [],
      });
    });
  });
});
