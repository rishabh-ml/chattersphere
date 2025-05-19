import { NextRequest } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { DELETE } from '@/app/api/users/[userId]/route';
import User from '@/models/User';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import Membership from '@/models/Membership';
import mongoose from 'mongoose';
import { invalidateCache } from '@/lib/redis';

// Mock the dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  clerkClient: {
    users: {
      deleteUser: jest.fn(),
    },
  },
}));

jest.mock('@/lib/dbConnect', () => jest.fn().mockResolvedValue(true));

jest.mock('@/models/User', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  findByIdAndDelete: jest.fn(),
  updateMany: jest.fn(),
}));

jest.mock('@/models/Post', () => ({
  find: jest.fn(),
  deleteMany: jest.fn(),
}));

jest.mock('@/models/Comment', () => ({
  deleteMany: jest.fn(),
}));

jest.mock('@/models/Membership', () => ({
  deleteMany: jest.fn(),
}));

jest.mock('@/lib/redis', () => ({
  invalidateCache: jest.fn(),
}));

// Mock mongoose
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    Types: {
      ObjectId: {
        isValid: jest.fn().mockReturnValue(true),
      },
    },
    startSession: jest.fn().mockReturnValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn().mockResolvedValue(true),
      abortTransaction: jest.fn().mockResolvedValue(true),
      endSession: jest.fn(),
    }),
  };
});

describe('User Account Deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when not authenticated', async () => {
    // Mock auth (not authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: null });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/users/user123');
    const response = await DELETE(request, { params: { userId: 'user123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 when user to delete is not found', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });

    // Mock User.findById (user not found)
    (User.findById as jest.Mock).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/users/user123');
    const response = await DELETE(request, { params: { userId: 'user123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 404 when authenticated user is not found', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });

    // Mock User.findById (user to delete found)
    (User.findById as jest.Mock).mockResolvedValue({
      _id: 'user123',
      clerkId: 'clerk123',
    });

    // Mock User.findOne (authenticated user not found)
    (User.findOne as jest.Mock).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/users/user123');
    const response = await DELETE(request, { params: { userId: 'user123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(404);
    expect(data.error).toBe('Authenticated user not found');
  });

  it('should return 403 when trying to delete another user\'s account', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });

    // Mock User.findById (user to delete found)
    (User.findById as jest.Mock).mockResolvedValue({
      _id: 'user123',
      clerkId: 'clerk456',
      toString: () => 'user123',
    });

    // Mock User.findOne (authenticated user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user789',
      clerkId: 'clerk123',
      toString: () => 'user789',
    });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/users/user123');
    const response = await DELETE(request, { params: { userId: 'user123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(403);
    expect(data.error).toBe('You can only delete your own account');
  });

  it('should successfully delete a user account and all associated data', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });

    // Mock User.findById (user to delete found)
    (User.findById as jest.Mock).mockResolvedValue({
      _id: 'user123',
      clerkId: 'clerk123',
      toString: () => 'user123',
    });

    // Mock User.findOne (authenticated user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
      clerkId: 'clerk123',
      toString: () => 'user123',
    });

    // Mock Post.find (user's posts)
    (Post.find as jest.Mock).mockResolvedValue([
      { _id: 'post1' },
      { _id: 'post2' },
    ]);

    // Mock successful deletion operations
    (Comment.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 10 });
    (Post.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });
    (Membership.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 });
    (User.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 5 });
    (User.findByIdAndDelete as jest.Mock).mockResolvedValue({});
    (clerkClient.users.deleteUser as jest.Mock).mockResolvedValue({});
    (invalidateCache as jest.Mock).mockResolvedValue(true);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/users/user123');
    const response = await DELETE(request, { params: { userId: 'user123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('User account and all associated data deleted successfully');
    
    // Verify all deletion operations were called
    expect(Comment.deleteMany).toHaveBeenCalledTimes(2);
    expect(Post.deleteMany).toHaveBeenCalledWith({ author: 'user123' }, { session: expect.anything() });
    expect(Membership.deleteMany).toHaveBeenCalledWith({ user: 'user123' }, { session: expect.anything() });
    expect(User.updateMany).toHaveBeenCalledTimes(2);
    expect(User.findByIdAndDelete).toHaveBeenCalledWith('user123', { session: expect.anything() });
    expect(clerkClient.users.deleteUser).toHaveBeenCalledWith('clerk123');
    expect(invalidateCache).toHaveBeenCalledTimes(2);
  });

  it('should handle Clerk API errors gracefully', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });

    // Mock User.findById (user to delete found)
    (User.findById as jest.Mock).mockResolvedValue({
      _id: 'user123',
      clerkId: 'clerk123',
      toString: () => 'user123',
    });

    // Mock User.findOne (authenticated user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
      clerkId: 'clerk123',
      toString: () => 'user123',
    });

    // Mock Post.find (user's posts)
    (Post.find as jest.Mock).mockResolvedValue([
      { _id: 'post1' },
      { _id: 'post2' },
    ]);

    // Mock successful MongoDB deletion operations
    (Comment.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 10 });
    (Post.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });
    (Membership.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 });
    (User.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 5 });
    (User.findByIdAndDelete as jest.Mock).mockResolvedValue({});
    
    // Mock Clerk API error
    (clerkClient.users.deleteUser as jest.Mock).mockRejectedValue(new Error('Clerk API error'));
    
    (invalidateCache as jest.Mock).mockResolvedValue(true);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/users/user123');
    const response = await DELETE(request, { params: { userId: 'user123' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('User account and all associated data deleted successfully');
    
    // Verify all MongoDB deletion operations were called
    expect(Comment.deleteMany).toHaveBeenCalledTimes(2);
    expect(Post.deleteMany).toHaveBeenCalledWith({ author: 'user123' }, { session: expect.anything() });
    expect(Membership.deleteMany).toHaveBeenCalledWith({ user: 'user123' }, { session: expect.anything() });
    expect(User.updateMany).toHaveBeenCalledTimes(2);
    expect(User.findByIdAndDelete).toHaveBeenCalledWith('user123', { session: expect.anything() });
    
    // Verify Clerk API was called but error was handled
    expect(clerkClient.users.deleteUser).toHaveBeenCalledWith('clerk123');
    expect(invalidateCache).toHaveBeenCalledTimes(2);
  });
});
