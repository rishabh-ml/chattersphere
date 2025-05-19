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
import { GET as getCommunityPosts } from '../communities/[communityId]/posts/route';
import { GET as getPost } from '../posts/[postId]/route';
import { GET as getComments } from '../posts/[postId]/comments/route';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/dbConnect';
import User from '@/models/User';
import Post from '@/models/Post';
import Community from '@/models/Community';
import Membership from '@/models/Membership';
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

jest.mock('@/models/Post', () => ({
  findById: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('@/models/Community', () => ({
  findById: jest.fn(),
}));

jest.mock('@/models/Membership', () => ({
  findOne: jest.fn(),
}));

// Mock mongoose
jest.mock('mongoose', () => {
  const originalMongoose = jest.requireActual('mongoose');
  return {
    ...originalMongoose,
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id),
    },
    model: jest.fn().mockImplementation(() => ({
      findById: jest.fn().mockImplementation((id) => Community.findById(id)),
    })),
  };
});

describe('Private Community Access Control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (connectToDatabase as jest.Mock).mockResolvedValue(undefined);
  });

  describe('GET /api/communities/[communityId]/posts', () => {
    it('should return 401 when accessing private community posts without authentication', async () => {
      // Mock auth (not authenticated)
      (auth as jest.Mock).mockResolvedValue({ userId: null });

      // Mock community
      (Community.findById as jest.Mock).mockResolvedValue({
        _id: 'community123',
        name: 'Private Community',
        isPrivate: true,
        members: ['user123'],
      });

      // Mock Membership.findOne to return null (no membership)
      (Membership.findOne as jest.Mock).mockResolvedValue(null);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/communities/community123/posts');
      const response = await getCommunityPosts(request, { params: { communityId: 'community123' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(data.error).toBe('You must be signed in to view posts in this private community');
    });

    it('should return 403 when accessing private community posts as non-member', async () => {
      // Mock auth (authenticated)
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk_user123' });

      // Mock user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user456',
        clerkId: 'clerk_user123',
      });

      // Mock community
      (Community.findById as jest.Mock).mockResolvedValue({
        _id: 'community123',
        name: 'Private Community',
        isPrivate: true,
        members: ['user123', 'user789'], // User is not a member
        members: {
          some: jest.fn().mockReturnValue(false), // User is not a member
        },
      });

      // Mock Membership.findOne to return null (no membership)
      (Membership.findOne as jest.Mock).mockResolvedValue(null);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/communities/community123/posts');
      const response = await getCommunityPosts(request, { params: { communityId: 'community123' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toBe('You are not authorized to view posts in this private community');
    });

    it('should allow access to private community posts for members', async () => {
      // Mock auth (authenticated)
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk_user123' });

      // Mock user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user123',
        clerkId: 'clerk_user123',
      });

      // Mock community
      (Community.findById as jest.Mock).mockResolvedValue({
        _id: 'community123',
        name: 'Private Community',
        isPrivate: true,
        members: ['user123', 'user789'],
        members: {
          some: jest.fn().mockReturnValue(true), // User is a member
        },
      });

      // Mock Membership.findOne to return a membership (user is a member)
      (Membership.findOne as jest.Mock).mockResolvedValue({
        _id: 'membership123',
        user: 'user123',
        community: 'community123',
        status: 'ACTIVE'
      });

      // Mock posts
      (Post.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      // Mock count
      (Post.countDocuments as jest.Mock).mockResolvedValue(0);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/communities/community123/posts');
      const response = await getCommunityPosts(request, { params: { communityId: 'community123' } });

      // Assertions
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/posts/[postId]', () => {
    it('should return 401 when accessing a post from a private community without authentication', async () => {
      // Mock auth (not authenticated)
      (auth as jest.Mock).mockResolvedValue({ userId: null });

      // Mock post
      (Post.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue({
          _id: 'post123',
          community: {
            _id: 'community123',
          },
        }),
      });

      // Mock community
      (Community.findById as jest.Mock).mockResolvedValue({
        _id: 'community123',
        isPrivate: true,
        members: ['user123'],
      });

      // Mock Membership.findOne to return null (no membership)
      (Membership.findOne as jest.Mock).mockResolvedValue(null);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/posts/post123');
      const response = await getPost(request, { params: { postId: 'post123' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(data.error).toBe('You must be signed in to view posts in this private community');
    });
  });

  describe('GET /api/posts/[postId]/comments', () => {
    it('should return 401 when accessing comments for a post from a private community without authentication', async () => {
      // Mock auth (not authenticated)
      (auth as jest.Mock).mockResolvedValue({ userId: null });

      // Mock post
      (Post.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'post123',
          community: 'community123',
        }),
      });

      // Mock community
      (Community.findById as jest.Mock).mockResolvedValue({
        _id: 'community123',
        isPrivate: true,
        members: ['user123'],
      });

      // Mock Membership.findOne to return null (no membership)
      (Membership.findOne as jest.Mock).mockResolvedValue(null);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/posts/post123/comments');
      const response = await getComments(request, { params: { postId: 'post123' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(401);
      expect(data.error).toBe('You must be signed in to view comments in this private community');
    });
  });
});
