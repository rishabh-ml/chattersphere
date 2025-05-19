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
import { GET } from '../communities/slug/[slug]/route';
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
  findOne: jest.fn(),
}));

describe('Community Slug API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when community is not found', async () => {
    // Mock auth
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_123' });

    // Mock database connection
    (connectToDatabase as jest.Mock).mockResolvedValue(undefined);

    // Mock Community.findOne to return null (community not found)
    (Community.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    });

    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/communities/slug/test-community');

    // Call the API
    const response = await GET(request, { params: { slug: 'test-community' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
    expect(data.error.message).toBe('Community not found');
  });

  it('should return community data when found', async () => {
    // Mock auth
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_123' });

    // Mock database connection
    (connectToDatabase as jest.Mock).mockResolvedValue(undefined);

    // Mock user
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      clerkId: 'user_123',
      username: 'testuser',
      name: 'Test User',
    };
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    // Mock community
    const mockCommunity = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Community',
      slug: 'test-community',
      description: 'A test community',
      image: 'https://example.com/image.jpg',
      banner: 'https://example.com/banner.jpg',
      isPrivate: false,
      requiresApproval: false,
      creator: {
        _id: mockUser._id,
        username: mockUser.username,
        name: mockUser.name,
        image: 'https://example.com/avatar.jpg',
      },
      members: [mockUser._id],
      moderators: [mockUser._id],
      posts: [],
      channels: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock Community.findOne to return the mock community
    (Community.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockCommunity),
    });

    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/communities/slug/test-community');

    // Call the API
    const response = await GET(request, { params: { slug: 'test-community' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.community).toBeDefined();
    expect(data.community.name).toBe('Test Community');
    expect(data.community.slug).toBe('test-community');
    expect(data.community.isMember).toBe(true);
    expect(data.community.isModerator).toBe(true);
    expect(data.community.isCreator).toBe(true);
  });

  it('should handle database connection errors', async () => {
    // Mock auth
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_123' });

    // Mock database connection to throw an error
    const dbError = new Error('Database connection failed');
    (connectToDatabase as jest.Mock).mockRejectedValue(dbError);

    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/communities/slug/test-community');

    // Call the API
    const response = await GET(request, { params: { slug: 'test-community' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
    expect(data.error.message).toBe('Database connection failed');
  });
});
