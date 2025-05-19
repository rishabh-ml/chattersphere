import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DELETE } from '@/app/api/posts/[postId]/route';
import User from '@/models/User';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
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

jest.mock('@/models/Post', () => ({
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock('@/models/Comment', () => ({
  deleteMany: jest.fn(),
}));

jest.mock('@/models/Membership', () => ({
  findOne: jest.fn(),
}));

jest.mock('@/lib/redis', () => ({
  invalidateCache: jest.fn(),
}));

// Mock mongoose.Types.ObjectId.isValid
mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);

describe('Post Deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    // Mock auth (not authenticated)
    (auth as jest.Mock).mockReturnValue({ userId: null });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/posts/post123');
    const response = await DELETE(request, { params: { postId: 'post123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(401);
    expect(data.error).toBe('You must be signed in to delete a post');
  });

  it('should return 404 when user not found', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockReturnValue({ userId: 'user123' });

    // Mock User.findOne (user not found)
    (User.findOne as jest.Mock).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/posts/post123');
    const response = await DELETE(request, { params: { postId: 'post123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 404 when post not found', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockReturnValue({ userId: 'user123' });

    // Mock User.findOne (user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
    });

    // Mock Post.findById (post not found)
    (Post.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/posts/post123');
    const response = await DELETE(request, { params: { postId: 'post123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(404);
    expect(data.error).toBe('Post not found');
  });

  it('should return 403 when user is not authorized to delete the post', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockReturnValue({ userId: 'user123' });

    // Mock User.findOne (user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
    });

    // Mock Post.findById (post found)
    (Post.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'post123',
        author: 'user456', // Different user
        community: {
          _id: 'community123',
        },
        toString: () => 'post123',
      }),
    });

    // Mock Membership.findOne (not an admin or moderator)
    (Membership.findOne as jest.Mock).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/posts/post123');
    const response = await DELETE(request, { params: { postId: 'post123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(403);
    expect(data.error).toBe('You are not authorized to delete this post');
  });

  it('should successfully delete a post when user is the author', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockReturnValue({ userId: 'user123' });

    // Mock User.findOne (user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
    });

    // Mock Post.findById (post found)
    (Post.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'post123',
        author: 'user123', // Same user
        community: {
          _id: 'community123',
        },
        toString: () => 'post123',
      }),
    });

    // Mock Comment.deleteMany
    (Comment.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });

    // Mock Post.findByIdAndDelete
    (Post.findByIdAndDelete as jest.Mock).mockResolvedValue({});

    // Mock invalidateCache
    (invalidateCache as jest.Mock).mockResolvedValue(true);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/posts/post123');
    const response = await DELETE(request, { params: { postId: 'post123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.message).toBe('Post and associated comments deleted successfully');
    expect(Comment.deleteMany).toHaveBeenCalledWith({ post: 'post123' });
    expect(Post.findByIdAndDelete).toHaveBeenCalledWith('post123');
    expect(invalidateCache).toHaveBeenCalledTimes(3);
  });

  it('should successfully delete a post when user is a community admin', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockReturnValue({ userId: 'user123' });

    // Mock User.findOne (user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
    });

    // Mock Post.findById (post found)
    (Post.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'post123',
        author: 'user456', // Different user
        community: {
          _id: 'community123',
        },
        toString: () => 'post123',
      }),
    });

    // Mock Membership.findOne (user is an admin)
    (Membership.findOne as jest.Mock).mockResolvedValue({
      _id: 'membership123',
      role: 'ADMIN',
    });

    // Mock Comment.deleteMany
    (Comment.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });

    // Mock Post.findByIdAndDelete
    (Post.findByIdAndDelete as jest.Mock).mockResolvedValue({});

    // Mock invalidateCache
    (invalidateCache as jest.Mock).mockResolvedValue(true);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/posts/post123');
    const response = await DELETE(request, { params: { postId: 'post123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.message).toBe('Post and associated comments deleted successfully');
    expect(Comment.deleteMany).toHaveBeenCalledWith({ post: 'post123' });
    expect(Post.findByIdAndDelete).toHaveBeenCalledWith('post123');
    expect(invalidateCache).toHaveBeenCalledTimes(3);
  });
});
