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
import { POST as joinCommunity } from '../communities/[communityId]/membership/route';
import { GET as getMembershipRequests } from '../communities/[communityId]/membership-requests/route';
import { PATCH as processMembershipRequest } from '../communities/[communityId]/membership/[userId]/route';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/dbConnect';
import User from '@/models/User';
import Community from '@/models/Community';
import Membership, { MembershipStatus } from '@/models/Membership';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/dbConnect', () => jest.fn());

// Mock models
jest.mock('@/models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('@/models/Community', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('@/models/Membership', () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
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
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    })),
  };
});

describe('Membership Approval Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (connectToDatabase as jest.Mock).mockResolvedValue(undefined);
  });

  describe('POST /api/communities/[communityId]/membership', () => {
    it('should create a pending membership request for communities with requiresApproval=true', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk_user123' });

      // Mock user
      const mockUser = {
        _id: 'user123',
        clerkId: 'clerk_user123',
        username: 'testuser',
        name: 'Test User',
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Mock community with requiresApproval=true
      const mockCommunity = {
        _id: 'community123',
        name: 'Private Community',
        requiresApproval: true,
        creator: 'creator123',
        moderators: ['creator123', 'mod456'],
        members: ['creator123', 'mod456'],
      };
      (Community.findById as jest.Mock).mockResolvedValue(mockCommunity);

      // Mock membership check
      (Membership.findOne as jest.Mock).mockResolvedValue(null);

      // Mock membership creation
      (Membership.create as jest.Mock).mockResolvedValue({
        _id: 'membership123',
        user: 'user123',
        community: 'community123',
        status: MembershipStatus.PENDING,
        joinedAt: new Date(),
      });

      // Mock notification model
      (mongoose.model as jest.Mock).mockReturnValue({
        create: jest.fn().mockResolvedValue({}),
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/communities/community123/membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join',
        }),
      });

      const response = await joinCommunity(request, { params: { communityId: 'community123' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(202);
      expect(data.success).toBe(true);
      expect(data.action).toBe('request');
      expect(data.status).toBe(MembershipStatus.PENDING);
      expect(data.isMember).toBe(false);

      // Verify membership was created with PENDING status
      expect(Membership.create).toHaveBeenCalledWith({
        user: 'user123',
        community: 'community123',
        status: MembershipStatus.PENDING,
        joinedAt: expect.any(Date),
      });

      // Verify notifications were created
      expect(mongoose.model).toHaveBeenCalledWith('Notification');
    });

    it('should add user directly for communities with requiresApproval=false', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk_user123' });

      // Mock user
      const mockUser = {
        _id: 'user123',
        clerkId: 'clerk_user123',
        username: 'testuser',
        name: 'Test User',
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Mock community with requiresApproval=false
      const mockCommunity = {
        _id: 'community123',
        name: 'Public Community',
        requiresApproval: false,
        creator: 'creator123',
        moderators: ['creator123'],
        members: ['creator123'],
      };
      (Community.findById as jest.Mock).mockResolvedValue(mockCommunity);

      // Mock membership check
      (Membership.findOne as jest.Mock).mockResolvedValue(null);

      // Mock mongoose model
      (mongoose.model as jest.Mock).mockReturnValue({
        findOneAndUpdate: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/communities/community123/membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join',
        }),
      });

      // Mock updated community for member count
      (Community.findById as jest.Mock).mockResolvedValueOnce(mockCommunity).mockResolvedValueOnce({
        ...mockCommunity,
        members: [...mockCommunity.members, 'user123'],
      });

      const response = await joinCommunity(request, { params: { communityId: 'community123' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('join');
      expect(data.isMember).toBe(true);

      // Verify user was added to community
      expect(Community.findByIdAndUpdate).toHaveBeenCalledWith('community123', {
        $addToSet: { members: 'user123' },
      });

      // Verify community was added to user
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', {
        $addToSet: { communities: 'community123' },
      });
    });
  });

  describe('GET /api/communities/[communityId]/membership-requests', () => {
    it('should return pending membership requests for moderators', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk_mod123' });

      // Mock moderator user
      const mockModerator = {
        _id: 'mod456',
        clerkId: 'clerk_mod123',
        username: 'moduser',
        name: 'Moderator User',
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockModerator);

      // Mock community
      const mockCommunity = {
        _id: 'community123',
        name: 'Private Community',
        requiresApproval: true,
        creator: 'creator123',
        moderators: ['creator123', 'mod456'],
        members: ['creator123', 'mod456'],
      };
      (Community.findById as jest.Mock).mockResolvedValue(mockCommunity);

      // Mock pending requests
      const mockRequests = [
        {
          _id: 'membership123',
          user: {
            _id: 'user123',
            username: 'testuser',
            name: 'Test User',
            image: 'https://example.com/avatar.jpg',
          },
          community: 'community123',
          status: MembershipStatus.PENDING,
          joinedAt: new Date('2023-01-01'),
        },
        {
          _id: 'membership456',
          user: {
            _id: 'user456',
            username: 'anotheruser',
            name: 'Another User',
            image: null,
          },
          community: 'community123',
          status: MembershipStatus.PENDING,
          joinedAt: new Date('2023-01-02'),
        },
      ];

      (Membership.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockRequests),
      });

      (Membership.countDocuments as jest.Mock).mockResolvedValue(2);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/communities/community123/membership-requests');

      const response = await getMembershipRequests(request, { params: { communityId: 'community123' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.requests).toHaveLength(2);
      expect(data.requests[0].user.username).toBe('testuser');
      expect(data.requests[1].user.username).toBe('anotheruser');
      expect(data.pagination.totalRequests).toBe(2);
    });

    it('should return 403 for non-moderators', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk_user123' });

      // Mock regular user
      const mockUser = {
        _id: 'user123',
        clerkId: 'clerk_user123',
        username: 'testuser',
        name: 'Test User',
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Mock community
      const mockCommunity = {
        _id: 'community123',
        name: 'Private Community',
        requiresApproval: true,
        creator: 'creator123',
        moderators: ['creator123', 'mod456'],
        members: ['creator123', 'mod456', 'user123'],
      };
      (Community.findById as jest.Mock).mockResolvedValue(mockCommunity);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/communities/community123/membership-requests');

      const response = await getMembershipRequests(request, { params: { communityId: 'community123' } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toBe("You don't have permission to view membership requests");
    });
  });

  describe('PATCH /api/communities/[communityId]/membership/[userId]', () => {
    it('should approve a membership request', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk_mod123' });

      // Mock moderator user
      const mockModerator = {
        _id: 'mod456',
        clerkId: 'clerk_mod123',
        username: 'moduser',
        name: 'Moderator User',
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockModerator);

      // Mock community
      const mockCommunity = {
        _id: 'community123',
        name: 'Private Community',
        requiresApproval: true,
        creator: 'creator123',
        moderators: ['creator123', 'mod456'],
        members: ['creator123', 'mod456'],
      };
      (Community.findById as jest.Mock).mockResolvedValue(mockCommunity);

      // Mock requesting user
      const mockRequestingUser = {
        _id: 'user123',
        username: 'testuser',
        name: 'Test User',
      };
      (User.findById as jest.Mock).mockResolvedValue(mockRequestingUser);

      // Mock membership request
      const mockMembershipRequest = {
        _id: 'membership123',
        user: 'user123',
        community: 'community123',
        status: MembershipStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };
      (Membership.findOne as jest.Mock).mockResolvedValue(mockMembershipRequest);

      // Mock notification model
      (mongoose.model as jest.Mock).mockReturnValue({
        create: jest.fn().mockResolvedValue({}),
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/communities/community123/membership/user123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
        }),
      });

      const response = await processMembershipRequest(request, {
        params: { communityId: 'community123', userId: 'user123' }
      });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('approve');
      expect(data.status).toBe(MembershipStatus.ACTIVE);

      // Verify membership was updated
      expect(mockMembershipRequest.status).toBe(MembershipStatus.ACTIVE);
      expect(mockMembershipRequest.save).toHaveBeenCalled();

      // Verify user was added to community
      expect(Community.findByIdAndUpdate).toHaveBeenCalledWith('community123', {
        $addToSet: { members: 'user123' },
      });

      // Verify community was added to user
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', {
        $addToSet: { communities: 'community123' },
      });

      // Verify notification was created
      expect(mongoose.model).toHaveBeenCalledWith('Notification');
    });

    it('should reject a membership request', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk_mod123' });

      // Mock moderator user
      const mockModerator = {
        _id: 'mod456',
        clerkId: 'clerk_mod123',
        username: 'moduser',
        name: 'Moderator User',
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockModerator);

      // Mock community
      const mockCommunity = {
        _id: 'community123',
        name: 'Private Community',
        requiresApproval: true,
        creator: 'creator123',
        moderators: ['creator123', 'mod456'],
        members: ['creator123', 'mod456'],
      };
      (Community.findById as jest.Mock).mockResolvedValue(mockCommunity);

      // Mock requesting user
      const mockRequestingUser = {
        _id: 'user123',
        username: 'testuser',
        name: 'Test User',
      };
      (User.findById as jest.Mock).mockResolvedValue(mockRequestingUser);

      // Mock membership request
      const mockMembershipRequest = {
        _id: 'membership123',
        user: 'user123',
        community: 'community123',
        status: MembershipStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };
      (Membership.findOne as jest.Mock).mockResolvedValue(mockMembershipRequest);

      // Mock notification model
      (mongoose.model as jest.Mock).mockReturnValue({
        create: jest.fn().mockResolvedValue({}),
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/communities/community123/membership/user123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          message: 'Community is currently at capacity',
        }),
      });

      const response = await processMembershipRequest(request, {
        params: { communityId: 'community123', userId: 'user123' }
      });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('reject');
      expect(data.status).toBe(MembershipStatus.REJECTED);

      // Verify membership was updated
      expect(mockMembershipRequest.status).toBe(MembershipStatus.REJECTED);
      expect(mockMembershipRequest.save).toHaveBeenCalled();

      // Verify user was NOT added to community
      expect(Community.findByIdAndUpdate).not.toHaveBeenCalledWith('community123', {
        $addToSet: { members: 'user123' },
      });

      // Verify notification was created
      expect(mongoose.model).toHaveBeenCalledWith('Notification');
    });

    it('should return 403 for non-moderators', async () => {
      // Mock auth
      (auth as jest.Mock).mockResolvedValue({ userId: 'clerk_user123' });

      // Mock regular user
      const mockUser = {
        _id: 'user789',
        clerkId: 'clerk_user123',
        username: 'regularuser',
        name: 'Regular User',
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Mock community
      const mockCommunity = {
        _id: 'community123',
        name: 'Private Community',
        requiresApproval: true,
        creator: 'creator123',
        moderators: ['creator123', 'mod456'],
        members: ['creator123', 'mod456', 'user789'],
      };
      (Community.findById as jest.Mock).mockResolvedValue(mockCommunity);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/communities/community123/membership/user123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
        }),
      });

      const response = await processMembershipRequest(request, {
        params: { communityId: 'community123', userId: 'user123' }
      });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toBe("You don't have permission to manage membership requests");
    });
  });
});
