import { NextRequest, NextResponse } from 'next/server';
import { POST, DELETE } from '../communities/[communityId]/membership/route';
import { auth } from '@clerk/nextjs/server';
import User from '@/models/User';
import Community from '@/models/Community';
import Membership from '@/models/Membership';
import mongoose from 'mongoose';





describe('Community Membership API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default auth mock
    (auth as jest.Mock).mockResolvedValue({
      userId: 'user_123',
    });
  });

  describe('POST /api/communities/[communityId]/membership', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      (auth as jest.Mock).mockResolvedValue({ userId: null });

      const req = new NextRequest('http://localhost:3000/api/communities/community123/membership', {
        method: 'POST',
      });

      const response = await POST(req, { params: { communityId: 'community123' } });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if communityId is invalid', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities/invalid-id/membership', {
        method: 'POST',
      });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      const response = await POST(req, { params: { communityId: 'invalid-id' } });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid communityId format' });
    });

    it('should return 404 if community is not found', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities/507f1f77bcf86cd799439011/membership', {
        method: 'POST',
      });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Mock Community.findById to return null
      (Community.findById as jest.Mock).mockResolvedValue(null);

      const response = await POST(req, { params: { communityId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Community not found' });
    });

    it('should return 404 if user is not found', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities/507f1f77bcf86cd799439011/membership', {
        method: 'POST',
      });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Mock Community.findById to return a community
      (Community.findById as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Community',
      });

      // Mock User.findOne to return null
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const response = await POST(req, { params: { communityId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'User not found' });
    });

    it('should return 400 if user is already a member', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities/507f1f77bcf86cd799439011/membership', {
        method: 'POST',
      });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Mock Community.findById to return a community
      (Community.findById as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Community',
      });

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
      });

      // Mock Membership.findOne to return a membership (user is already a member)
      (Membership.findOne as jest.Mock).mockResolvedValue({
        _id: 'membership_id',
        user: 'user_db_id',
        community: '507f1f77bcf86cd799439011',
        status: 'ACTIVE',
      });

      const response = await POST(req, { params: { communityId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'User is already a member of this community' });
    });

    it('should successfully join a community', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities/507f1f77bcf86cd799439011/membership', {
        method: 'POST',
      });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Mock Community.findById to return a community
      (Community.findById as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Community',
        requiresApproval: false,
      });

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
      });

      // Mock Membership.findOne to return null (user is not a member)
      (Membership.findOne as jest.Mock).mockResolvedValue(null);

      // Mock Membership.create
      (Membership.create as jest.Mock).mockResolvedValue({
        _id: 'new_membership_id',
        user: 'user_db_id',
        community: '507f1f77bcf86cd799439011',
        status: 'ACTIVE',
        joinedAt: new Date(),
      });

      // Mock Membership.countDocuments
      (Membership.countDocuments as jest.Mock).mockResolvedValue(10);

      const response = await POST(req, { params: { communityId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        success: true,
        message: 'Successfully joined the community',
        memberCount: 10,
      });

      // Verify Membership.create was called with correct parameters
      expect(Membership.create).toHaveBeenCalledWith({
        user: 'user_db_id',
        community: '507f1f77bcf86cd799439011',
        status: 'ACTIVE',
        joinedAt: expect.any(Date),
      });
    });

    it('should handle joining a community that requires approval', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities/507f1f77bcf86cd799439011/membership', {
        method: 'POST',
      });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Mock Community.findById to return a community that requires approval
      (Community.findById as jest.Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Community',
        requiresApproval: true,
      });

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
      });

      // Mock Membership.findOne to return null (user is not a member)
      (Membership.findOne as jest.Mock).mockResolvedValue(null);

      // Mock Membership.create
      (Membership.create as jest.Mock).mockResolvedValue({
        _id: 'new_membership_id',
        user: 'user_db_id',
        community: '507f1f77bcf86cd799439011',
        status: 'PENDING',
        joinedAt: new Date(),
      });

      const response = await POST(req, { params: { communityId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        success: true,
        message: 'Membership request submitted and pending approval',
        status: 'PENDING',
      });

      // Verify Membership.create was called with correct parameters
      expect(Membership.create).toHaveBeenCalledWith({
        user: 'user_db_id',
        community: '507f1f77bcf86cd799439011',
        status: 'PENDING',
        joinedAt: expect.any(Date),
      });
    });
  });

  describe('DELETE /api/communities/[communityId]/membership', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated user
      (auth as jest.Mock).mockResolvedValue({ userId: null });

      const req = new NextRequest('http://localhost:3000/api/communities/community123/membership', {
        method: 'DELETE',
      });

      const response = await DELETE(req, { params: { communityId: 'community123' } });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if communityId is invalid', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities/invalid-id/membership', {
        method: 'DELETE',
      });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      const response = await DELETE(req, { params: { communityId: 'invalid-id' } });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid communityId format' });
    });

    it('should return 404 if user is not found', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities/507f1f77bcf86cd799439011/membership', {
        method: 'DELETE',
      });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Mock User.findOne to return null
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(req, { params: { communityId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'User not found' });
    });

    it('should return 404 if membership is not found', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities/507f1f77bcf86cd799439011/membership', {
        method: 'DELETE',
      });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
      });

      // Mock Membership.findOne to return null (user is not a member)
      (Membership.findOne as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(req, { params: { communityId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'User is not a member of this community' });
    });

    it('should successfully leave a community', async () => {
      const req = new NextRequest('http://localhost:3000/api/communities/507f1f77bcf86cd799439011/membership', {
        method: 'DELETE',
      });

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Mock User.findOne to return a user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user_db_id',
        clerkId: 'user_123',
        username: 'testuser',
      });

      // Mock Membership.findOne to return a membership
      (Membership.findOne as jest.Mock).mockResolvedValue({
        _id: 'membership_id',
        user: 'user_db_id',
        community: '507f1f77bcf86cd799439011',
        status: 'ACTIVE',
      });

      // Mock Membership.deleteOne
      (Membership.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      // Mock Membership.countDocuments
      (Membership.countDocuments as jest.Mock).mockResolvedValue(9);

      const response = await DELETE(req, { params: { communityId: '507f1f77bcf86cd799439011' } });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        success: true,
        message: 'Successfully left the community',
        memberCount: 9,
      });

      // Verify Membership.deleteOne was called with correct parameters
      expect(Membership.deleteOne).toHaveBeenCalledWith({
        user: 'user_db_id',
        community: '507f1f77bcf86cd799439011',
      });
    });
  });
});
