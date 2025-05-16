import { NextRequest } from 'next/server';
import { GET } from '../communities/[communityId]/route';
import { GET as GetBySlug } from '../communities/slug/[slug]/route';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/dbConnect';
import User from '@/models/User';
import Community from '@/models/Community';
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

jest.mock('@/models/Community', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
}));

// Mock mongoose
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn(),
    },
  },
}));

describe('Community API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/communities/[communityId]', () => {
    it('should return a community by ID', async () => {
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
      
      // Mock Community.findById
      (Community.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: 'community123',
          name: 'Test Community',
          slug: 'test-community',
          description: 'A test community',
          image: 'test.jpg',
          banner: 'banner.jpg',
          isPrivate: false,
          requiresApproval: false,
          creator: {
            _id: 'user456',
            username: 'creator',
            name: 'Creator User',
            image: 'creator.jpg',
          },
          members: ['user123', 'user456'],
          moderators: ['user456'],
          posts: ['post1', 'post2'],
          channels: ['channel1'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/communities/community123');
      
      // Call the handler
      const response = await GET(request, { params: { communityId: 'community123' } });
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.community).toBeDefined();
      expect(data.community.name).toBe('Test Community');
      expect(data.community.slug).toBe('test-community');
      expect(data.community.isMember).toBe(true);
      expect(data.community.isModerator).toBe(false);
      expect(data.community.isCreator).toBe(false);
    });
  });

  describe('GET /api/communities/slug/[slug]', () => {
    it('should return a community by slug', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });
      
      // Mock database connection
      (connectToDatabase as jest.Mock).mockResolvedValue(undefined);
      
      // Mock User.findOne
      (User.findOne as jest.Mock).mockResolvedValue({ 
        _id: 'user123',
        clerkId: 'clerk123',
      });
      
      // Mock Community.findOne
      (Community.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: 'community123',
          name: 'Test Community',
          slug: 'test-community',
          description: 'A test community',
          image: 'test.jpg',
          banner: 'banner.jpg',
          isPrivate: false,
          requiresApproval: false,
          creator: {
            _id: 'user456',
            username: 'creator',
            name: 'Creator User',
            image: 'creator.jpg',
          },
          members: ['user123', 'user456'],
          moderators: ['user456'],
          posts: ['post1', 'post2'],
          channels: ['channel1'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/communities/slug/test-community');
      
      // Call the handler
      const response = await GetBySlug(request, { params: { slug: 'test-community' } });
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.community).toBeDefined();
      expect(data.community.name).toBe('Test Community');
      expect(data.community.slug).toBe('test-community');
    });
  });
});
