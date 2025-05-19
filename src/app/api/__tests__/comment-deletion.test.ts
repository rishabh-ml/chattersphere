import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DELETE } from '@/app/api/comments/[commentId]/route';
import User from '@/models/User';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import Membership from '@/models/Membership';
import mongoose from 'mongoose';
import { invalidateCache } from '@/lib/redis';

// Mock the dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/dbConnect', () => jest.fn().mockResolvedValue(true));

jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
}));

jest.mock('@/models/Comment', () => ({
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  deleteMany: jest.fn(),
}));

jest.mock('@/models/Post', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('@/models/Membership', () => ({
  findOne: jest.fn(),
}));

jest.mock('@/lib/redis', () => ({
  invalidateCache: jest.fn(),
}));

// Mock mongoose.Types.ObjectId.isValid
mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);

describe('Comment Deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    // Mock auth (not authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: null });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/comments/comment123');
    const response = await DELETE(request, { params: { commentId: 'comment123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 when user not found', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });

    // Mock User.findOne (user not found)
    (User.findOne as jest.Mock).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/comments/comment123');
    const response = await DELETE(request, { params: { commentId: 'comment123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 404 when comment not found', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });

    // Mock User.findOne (user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
    });

    // Mock Comment.findById (comment not found)
    (Comment.findById as jest.Mock).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/comments/comment123');
    const response = await DELETE(request, { params: { commentId: 'comment123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(404);
    expect(data.error).toBe('Comment not found');
  });

  it('should return 404 when associated post not found', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });

    // Mock User.findOne (user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
    });

    // Mock Comment.findById (comment found)
    (Comment.findById as jest.Mock).mockResolvedValue({
      _id: 'comment123',
      author: 'user123',
      post: 'post123',
    });

    // Mock Post.findById (post not found)
    (Post.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/comments/comment123');
    const response = await DELETE(request, { params: { commentId: 'comment123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(404);
    expect(data.error).toBe('Associated post not found');
  });

  it('should return 403 when user is not authorized to delete the comment', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });

    // Mock User.findOne (user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
    });

    // Mock Comment.findById (comment found)
    (Comment.findById as jest.Mock).mockResolvedValue({
      _id: 'comment123',
      author: 'user456', // Different user
      post: 'post123',
      toString: () => 'comment123',
    });

    // Mock Post.findById (post found)
    (Post.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'post123',
        community: {
          _id: 'community123',
        },
      }),
    });

    // Mock Membership.findOne (not an admin or moderator)
    (Membership.findOne as jest.Mock).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/comments/comment123');
    const response = await DELETE(request, { params: { commentId: 'comment123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(403);
    expect(data.error).toBe('Not authorized to delete this comment');
  });

  it('should successfully delete a comment when user is the author', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });

    // Mock User.findOne (user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
    });

    // Mock Comment.findById (comment found)
    (Comment.findById as jest.Mock).mockResolvedValue({
      _id: 'comment123',
      author: 'user123', // Same user
      post: 'post123',
      toString: () => 'comment123',
    });

    // Mock Post.findById (post found)
    (Post.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'post123',
        community: {
          _id: 'community123',
        },
      }),
    });

    // Mock Comment.findByIdAndDelete
    (Comment.findByIdAndDelete as jest.Mock).mockResolvedValue({});

    // Mock Post.findByIdAndUpdate
    (Post.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    // Mock Comment.deleteMany
    (Comment.deleteMany as jest.Mock).mockResolvedValue({});

    // Mock invalidateCache
    (invalidateCache as jest.Mock).mockResolvedValue(true);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/comments/comment123');
    const response = await DELETE(request, { params: { commentId: 'comment123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Comment deleted successfully');
    expect(Comment.findByIdAndDelete).toHaveBeenCalledWith('comment123');
    expect(Post.findByIdAndUpdate).toHaveBeenCalledWith('post123', {
      $pull: { comments: 'comment123' },
    });
    expect(Comment.deleteMany).toHaveBeenCalledWith({ parentComment: 'comment123' });
    expect(invalidateCache).toHaveBeenCalledTimes(2);
  });

  it('should successfully delete a comment when user is a community admin', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });

    // Mock User.findOne (user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
    });

    // Mock Comment.findById (comment found)
    (Comment.findById as jest.Mock).mockResolvedValue({
      _id: 'comment123',
      author: 'user456', // Different user
      post: 'post123',
      toString: () => 'comment123',
    });

    // Mock Post.findById (post found)
    (Post.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'post123',
        community: {
          _id: 'community123',
        },
      }),
    });

    // Mock Membership.findOne (user is an admin)
    (Membership.findOne as jest.Mock).mockResolvedValue({
      _id: 'membership123',
      role: 'ADMIN',
    });

    // Mock Comment.findByIdAndDelete
    (Comment.findByIdAndDelete as jest.Mock).mockResolvedValue({});

    // Mock Post.findByIdAndUpdate
    (Post.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    // Mock Comment.deleteMany
    (Comment.deleteMany as jest.Mock).mockResolvedValue({});

    // Mock invalidateCache
    (invalidateCache as jest.Mock).mockResolvedValue(true);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/comments/comment123');
    const response = await DELETE(request, { params: { commentId: 'comment123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Comment deleted successfully');
    expect(Comment.findByIdAndDelete).toHaveBeenCalledWith('comment123');
    expect(Post.findByIdAndUpdate).toHaveBeenCalledWith('post123', {
      $pull: { comments: 'comment123' },
    });
    expect(Comment.deleteMany).toHaveBeenCalledWith({ parentComment: 'comment123' });
    expect(invalidateCache).toHaveBeenCalledTimes(2);
  });
});
