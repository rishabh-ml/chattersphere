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
import { GET, POST } from '../posts/[postId]/comments/route';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/dbConnect';
import User from '@/models/User';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
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
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('@/models/Comment', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
}));

// Mock mongoose
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn(),
    },
  },
  model: jest.fn().mockReturnValue({
    create: jest.fn(),
  }),
}));

describe('Comments API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/posts/[postId]/comments', () => {
    it('should return comments for a post', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Mock database connection
      (connectToDatabase as jest.Mock).mockResolvedValue(undefined);

      // Mock Post.findById
      (Post.findById as jest.Mock).mockResolvedValue({ _id: 'post123' });

      // Mock User.findOne
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user123' });

      // Mock Comment.find
      (Comment.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'comment123',
            author: {
              _id: 'user123',
              username: 'testuser',
              name: 'Test User',
              image: 'test.jpg',
            },
            content: 'Test comment',
            upvotes: [],
            downvotes: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      });

      // Mock Comment.countDocuments
      (Comment.countDocuments as jest.Mock).mockResolvedValue(1);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/posts/post123/comments');

      // Call the handler
      const response = await GET(request, { params: { postId: 'post123' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.comments).toBeDefined();
      expect(data.comments.length).toBe(1);
      expect(data.pagination).toBeDefined();
    });
  });

  describe('POST /api/posts/[postId]/comments', () => {
    it('should create a new comment', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Mock database connection
      (connectToDatabase as jest.Mock).mockResolvedValue(undefined);

      // Mock Post.findById
      (Post.findById as jest.Mock).mockResolvedValue({ _id: 'post123' });

      // Mock User.findOne
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'user123' });

      // Mock Comment.create
      (Comment.create as jest.Mock).mockResolvedValue({
        _id: 'comment123',
        author: 'user123',
        post: 'post123',
        content: 'Test comment',
        upvotes: [],
        downvotes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock Comment.findById
      (Comment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: 'comment123',
          author: {
            _id: 'user123',
            username: 'testuser',
            name: 'Test User',
            image: 'test.jpg',
          },
          post: 'post123',
          content: 'Test comment',
          upvotes: [],
          downvotes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/posts/post123/comments', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test comment' }),
      });

      // Call the handler
      const response = await POST(request, { params: { postId: 'post123' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(201);
      expect(data.comment).toBeDefined();
      expect(data.comment.content).toBe('Test comment');
    });
  });
});
