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
import { POST } from '../communities/route';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/dbConnect';
import User from '@/models/User';
import Community from '@/models/Community';
import mongoose from 'mongoose';
import { generateUniqueSlug } from '@/lib/utils';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/dbConnect', () => jest.fn());

// Mock models
jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('@/models/Community', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

// Mock generateUniqueSlug
jest.mock('@/lib/utils', () => ({
  generateUniqueSlug: jest.fn(),
}));

describe('Community API - Slug Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a slug when creating a community', async () => {
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
      image: 'https://example.com/avatar.jpg',
      communities: [],
      save: jest.fn().mockResolvedValue(true),
    };
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    // Mock community check
    (Community.findOne as jest.Mock).mockResolvedValue(null);

    // Mock slug generation
    (generateUniqueSlug as jest.Mock).mockResolvedValue('web-development');

    // Mock community creation
    const mockCommunity = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Web Development',
      slug: 'web-development',
      description: 'A community for web developers',
      image: 'https://example.com/webdev.jpg',
      creator: mockUser._id,
      members: [mockUser._id],
      moderators: [mockUser._id],
      posts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: () => ({
        _id: mockCommunity._id,
        name: mockCommunity.name,
        slug: mockCommunity.slug,
        description: mockCommunity.description,
        image: mockCommunity.image,
        creator: mockCommunity.creator,
        members: mockCommunity.members,
        moderators: mockCommunity.moderators,
        posts: mockCommunity.posts,
        createdAt: mockCommunity.createdAt,
        updatedAt: mockCommunity.updatedAt,
      }),
    };
    (Community.create as jest.Mock).mockResolvedValue(mockCommunity);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/communities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Web Development',
        description: 'A community for web developers',
        image: 'https://example.com/webdev.jpg',
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(201);
    expect(data.community).toBeDefined();
    expect(data.community.slug).toBe('web-development');

    // Verify generateUniqueSlug was called with correct parameters
    expect(generateUniqueSlug).toHaveBeenCalledWith('Web Development', Community);

    // Verify Community.create was called with the slug
    expect(Community.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Web Development',
      slug: 'web-development',
      description: 'A community for web developers',
    }));
  });

  it('should handle slug conflicts by appending numbers', async () => {
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
      image: 'https://example.com/avatar.jpg',
      communities: [],
      save: jest.fn().mockResolvedValue(true),
    };
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    // Mock community check
    (Community.findOne as jest.Mock).mockResolvedValue(null);

    // Mock slug generation with a conflict resolution
    (generateUniqueSlug as jest.Mock).mockResolvedValue('web-development-1');

    // Mock community creation
    const mockCommunity = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Web Development',
      slug: 'web-development-1',
      description: 'A community for web developers',
      image: 'https://example.com/webdev.jpg',
      creator: mockUser._id,
      members: [mockUser._id],
      moderators: [mockUser._id],
      posts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: () => ({
        _id: mockCommunity._id,
        name: mockCommunity.name,
        slug: mockCommunity.slug,
        description: mockCommunity.description,
        image: mockCommunity.image,
        creator: mockCommunity.creator,
        members: mockCommunity.members,
        moderators: mockCommunity.moderators,
        posts: mockCommunity.posts,
        createdAt: mockCommunity.createdAt,
        updatedAt: mockCommunity.updatedAt,
      }),
    };
    (Community.create as jest.Mock).mockResolvedValue(mockCommunity);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/communities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Web Development',
        description: 'Another community for web developers',
        image: 'https://example.com/webdev2.jpg',
      }),
    });

    // Call the API
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(201);
    expect(data.community).toBeDefined();
    expect(data.community.slug).toBe('web-development-1');

    // Verify generateUniqueSlug was called with correct parameters
    expect(generateUniqueSlug).toHaveBeenCalledWith('Web Development', Community);

    // Verify Community.create was called with the slug
    expect(Community.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Web Development',
      slug: 'web-development-1',
      description: 'Another community for web developers',
    }));
  });
});
