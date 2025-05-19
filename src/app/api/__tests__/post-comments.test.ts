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

jest.mock('@/models/Post', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('@/models/Comment', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('@/models/Community', () => ({
  findById: jest.fn(),
}));

describe('Post Comments API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default auth mock
    (auth as jest.Mock).mockResolvedValue({
      userId: 'user_123',
    });

    // Setup default database connection mock
    (connectToDatabase as jest.Mock).mockResolvedValue(undefined);

    // Mock mongoose.Types.ObjectId.isValid
    mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
  });

  describe('GET /api/posts/[postId]/comments', () => {
    it('should return 400 if postId is invalid', async () => {
      // Mock invalid ObjectId
      mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(false);

      const req = new NextRequest('http://localhost:3000/api/posts/invalid-id/comments');

      const response = await GET(req, { params: { postId: 'invalid-id' } });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid postId format' });
    });

    it('should return 404 if post is not found', async () => {
      const req = new NextRequest('http://localhost:3000/api/posts/507f1f77bcf86cd799439011/comments');

      // Mock Post.findById to return null
      (Post.findById as jest.Mock).mockResolvedValue(null);

      const response = await GET(req, { params: { postId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Post not found' });
    });

    it('should return 403 if post is in a private community and user is not a member', async () => {
      const req = new NextRequest('http://localhost:3000/api/posts/507f1f77bcf86cd799439011/comments');

      // Mock Post.findById to return a post with a community
      (Post.findById as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        content: 'Test post',
        community: {
          _id: 'community_id',
          name: 'Private Community',
          isPrivate: true,
        },
        populate: jest.fn().mockReturnThis(),
      });

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
      });

      // Mock Community.findById to check if user is a member
      (Community.findById as jest.Mock).mockImplementation(() => ({
        isMember: jest.fn().mockResolvedValue(false),
      }));

      const response = await GET(req, { params: { postId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'You do not have permission to view this post' });
    });

    it('should return comments for a public post', async () => {
      const req = new NextRequest('http://localhost:3000/api/posts/507f1f77bcf86cd799439011/comments?page=1&limit=10');

      // Mock Post.findById to return a post
      (Post.findById as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        content: 'Test post',
        community: null, // Public post (no community)
        populate: jest.fn().mockReturnThis(),
      });

      // Mock Comment.countDocuments
      (Comment.countDocuments as jest.Mock).mockResolvedValue(2);

      // Mock Comment.find
      (Comment.find as jest.Mock).mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'comment1',
            author: {
              _id: 'author1',
              username: 'user1',
              name: 'User One',
              image: 'https://example.com/user1.jpg',
            },
            content: 'First comment',
            upvotes: [],
            downvotes: [],
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01'),
          },
          {
            _id: 'comment2',
            author: {
              _id: 'author2',
              username: 'user2',
              name: 'User Two',
              image: 'https://example.com/user2.jpg',
            },
            content: 'Second comment',
            upvotes: ['user_db_id'], // Current user upvoted this
            downvotes: [],
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

      const response = await GET(req, { params: { postId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('comments');
      expect(responseData).toHaveProperty('pagination');
      expect(responseData.comments).toHaveLength(2);

      // Check first comment
      expect(responseData.comments[0]).toEqual({
        id: 'comment1',
        author: {
          id: 'author1',
          username: 'user1',
          name: 'User One',
          image: 'https://example.com/user1.jpg',
        },
        content: 'First comment',
        upvoteCount: 0,
        downvoteCount: 0,
        voteCount: 0,
        isUpvoted: false,
        isDownvoted: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Check second comment (upvoted by current user)
      expect(responseData.comments[1]).toEqual({
        id: 'comment2',
        author: {
          id: 'author2',
          username: 'user2',
          name: 'User Two',
          image: 'https://example.com/user2.jpg',
        },
        content: 'Second comment',
        upvoteCount: 1,
        downvoteCount: 0,
        voteCount: 1,
        isUpvoted: true,
        isDownvoted: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Check pagination
      expect(responseData.pagination).toEqual({
        page: 1,
        limit: 10,
        totalComments: 2,
        hasMore: false,
      });
    });
  });

  describe('POST /api/posts/[postId]/comments', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      (auth as jest.Mock).mockResolvedValue({ userId: null });

      const req = new NextRequest('http://localhost:3000/api/posts/507f1f77bcf86cd799439011/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: 'Test comment' }),
      });

      const response = await POST(req, { params: { postId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if postId is invalid', async () => {
      // Mock invalid ObjectId
      mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(false);

      const req = new NextRequest('http://localhost:3000/api/posts/invalid-id/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: 'Test comment' }),
      });

      const response = await POST(req, { params: { postId: 'invalid-id' } });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid postId format' });
    });

    it('should return 400 if content is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/posts/507f1f77bcf86cd799439011/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await POST(req, { params: { postId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Comment content is required' });
    });

    it('should return 404 if post is not found', async () => {
      const req = new NextRequest('http://localhost:3000/api/posts/507f1f77bcf86cd799439011/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: 'Test comment' }),
      });

      // Mock Post.findById to return null
      (Post.findById as jest.Mock).mockResolvedValue(null);

      const response = await POST(req, { params: { postId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Post not found' });
    });

    it('should return 404 if user is not found', async () => {
      const req = new NextRequest('http://localhost:3000/api/posts/507f1f77bcf86cd799439011/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: 'Test comment' }),
      });

      // Mock Post.findById to return a post
      (Post.findById as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        content: 'Test post',
      });

      // Mock User.findOne to return null
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const response = await POST(req, { params: { postId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'User not found' });
    });

    it('should return 403 if post is in a private community and user is not a member', async () => {
      const req = new NextRequest('http://localhost:3000/api/posts/507f1f77bcf86cd799439011/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: 'Test comment' }),
      });

      // Mock Post.findById to return a post with a community
      (Post.findById as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        content: 'Test post',
        community: {
          _id: 'community_id',
          name: 'Private Community',
          isPrivate: true,
        },
        populate: jest.fn().mockReturnThis(),
      });

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
      });

      // Mock Community.findById to check if user is a member
      (Community.findById as jest.Mock).mockImplementation(() => ({
        isMember: jest.fn().mockResolvedValue(false),
      }));

      const response = await POST(req, { params: { postId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'You do not have permission to comment on this post' });
    });

    it('should successfully create a comment', async () => {
      const req = new NextRequest('http://localhost:3000/api/posts/507f1f77bcf86cd799439011/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: 'Test comment' }),
      });

      // Mock Post.findById to return a post
      (Post.findById as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        content: 'Test post',
        community: null, // Public post (no community)
        populate: jest.fn().mockReturnThis(),
      });

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
      });

      // Mock Comment.create
      (Comment.create as jest.Mock).mockResolvedValue({
        _id: 'new_comment_id',
        author: 'user_db_id',
        post: '507f1f77bcf86cd799439011',
        content: 'Test comment',
        upvotes: [],
        downvotes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock Comment.findById for populating author
      (Comment.findById as jest.Mock).mockResolvedValue({
        _id: 'new_comment_id',
        author: {
          _id: 'user_db_id',
          username: 'testuser',
          name: 'Test User',
          image: 'https://example.com/user.jpg',
        },
        post: '507f1f77bcf86cd799439011',
        content: 'Test comment',
        upvotes: [],
        downvotes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({
          _id: 'new_comment_id',
          author: {
            _id: 'user_db_id',
            username: 'testuser',
            name: 'Test User',
            image: 'https://example.com/user.jpg',
          },
          post: '507f1f77bcf86cd799439011',
          content: 'Test comment',
          upvotes: [],
          downvotes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      // Mock Post.findByIdAndUpdate
      (Post.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await POST(req, { params: { postId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(201);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('comment');
      expect(responseData.comment).toEqual({
        id: 'new_comment_id',
        author: {
          id: 'user_db_id',
          username: 'testuser',
          name: 'Test User',
          image: 'https://example.com/user.jpg',
        },
        content: 'Test comment',
        upvoteCount: 0,
        downvoteCount: 0,
        voteCount: 0,
        isUpvoted: false,
        isDownvoted: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify Comment.create was called with correct parameters
      expect(Comment.create).toHaveBeenCalledWith({
        author: 'user_db_id',
        post: '507f1f77bcf86cd799439011',
        content: 'Test comment',
        upvotes: [],
        downvotes: [],
      });

      // Verify Post.findByIdAndUpdate was called to update post's comments array
      expect(Post.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        $push: { comments: 'new_comment_id' },
      });
    });

    it('should create a reply to another comment', async () => {
      const req = new NextRequest('http://localhost:3000/api/posts/507f1f77bcf86cd799439011/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Test reply',
          parentCommentId: 'parent_comment_id'
        }),
      });

      // Mock Post.findById to return a post
      (Post.findById as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        content: 'Test post',
        community: null, // Public post (no community)
        populate: jest.fn().mockReturnThis(),
      });

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
      });

      // Mock Comment.create
      (Comment.create as jest.Mock).mockResolvedValue({
        _id: 'new_reply_id',
        author: 'user_db_id',
        post: '507f1f77bcf86cd799439011',
        content: 'Test reply',
        parentComment: 'parent_comment_id',
        upvotes: [],
        downvotes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock Comment.findById for populating author
      (Comment.findById as jest.Mock).mockResolvedValue({
        _id: 'new_reply_id',
        author: {
          _id: 'user_db_id',
          username: 'testuser',
          name: 'Test User',
          image: 'https://example.com/user.jpg',
        },
        post: '507f1f77bcf86cd799439011',
        content: 'Test reply',
        parentComment: 'parent_comment_id',
        upvotes: [],
        downvotes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({
          _id: 'new_reply_id',
          author: {
            _id: 'user_db_id',
            username: 'testuser',
            name: 'Test User',
            image: 'https://example.com/user.jpg',
          },
          post: '507f1f77bcf86cd799439011',
          content: 'Test reply',
          parentComment: 'parent_comment_id',
          upvotes: [],
          downvotes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      // Mock Post.findByIdAndUpdate
      (Post.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const response = await POST(req, { params: { postId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(201);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('comment');
      expect(responseData.comment).toEqual({
        id: 'new_reply_id',
        author: {
          id: 'user_db_id',
          username: 'testuser',
          name: 'Test User',
          image: 'https://example.com/user.jpg',
        },
        content: 'Test reply',
        parentComment: 'parent_comment_id',
        upvoteCount: 0,
        downvoteCount: 0,
        voteCount: 0,
        isUpvoted: false,
        isDownvoted: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify Comment.create was called with correct parameters
      expect(Comment.create).toHaveBeenCalledWith({
        author: 'user_db_id',
        post: '507f1f77bcf86cd799439011',
        content: 'Test reply',
        upvotes: [],
        downvotes: [],
        parentComment: 'parent_comment_id',
      });
    });
  });
});
