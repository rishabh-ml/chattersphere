import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { POST } from '@/app/api/users/[userId]/follow/route';
import User from '@/models/User';
import mongoose from 'mongoose';

// Mock the dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/dbConnect', () => jest.fn().mockResolvedValue(true));

jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
}));

// Mock mongoose
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    model: jest.fn().mockReturnValue({
      create: jest.fn().mockResolvedValue({}),
    }),
  };
});

describe('Follow Privacy Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 403 when target user does not allow followers', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });

    // Mock User.findOne (current user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
      following: [],
      save: jest.fn().mockResolvedValue(true),
    });

    // Mock User.findById (target user found with allowFollowers=false)
    (User.findById as jest.Mock).mockResolvedValue({
      _id: 'user456',
      followers: [],
      privacySettings: {
        allowFollowers: false,
      },
      save: jest.fn().mockResolvedValue(true),
    });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/users/user456/follow');
    const response = await POST(request, { params: { userId: 'user456' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(403);
    expect(data.error).toBe('This user does not allow followers');
  });

  it('should allow following when target user allows followers', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });

    // Mock User.findOne (current user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
      following: [],
      save: jest.fn().mockResolvedValue(true),
    });

    // Mock User.findById (target user found with allowFollowers=true)
    (User.findById as jest.Mock).mockResolvedValue({
      _id: 'user456',
      followers: [],
      privacySettings: {
        allowFollowers: true,
      },
      save: jest.fn().mockResolvedValue(true),
    });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/users/user456/follow');
    const response = await POST(request, { params: { userId: 'user456' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.isFollowing).toBe(true);
  });

  it('should allow following when target user has no privacy settings (default behavior)', async () => {
    // Mock auth (authenticated)
    (auth as jest.Mock).mockResolvedValue({ userId: 'clerk123' });

    // Mock User.findOne (current user found)
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'user123',
      following: [],
      save: jest.fn().mockResolvedValue(true),
    });

    // Mock User.findById (target user found with no privacy settings)
    (User.findById as jest.Mock).mockResolvedValue({
      _id: 'user456',
      followers: [],
      // No privacySettings field
      save: jest.fn().mockResolvedValue(true),
    });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/users/user456/follow');
    const response = await POST(request, { params: { userId: 'user456' } });
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.isFollowing).toBe(true);
  });
});
