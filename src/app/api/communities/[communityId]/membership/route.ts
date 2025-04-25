import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import connectToDatabase from '@/lib/DbConnect';
import User from '@/models/User';
import Community from '@/models/Community';

export async function POST(
  req: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Parse request body
    const { action } = await req.json();

    // Validate action
    if (action !== 'join' && action !== 'leave') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Find the current user
    const currentUser = await User.findOne({ clerkId: userId });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the community
    const community = await Community.findById(params.communityId);

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator (creator cannot leave)
    if (action === 'leave' && community.creator.equals(currentUser._id)) {
      return NextResponse.json(
        { error: 'Community creator cannot leave the community' },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const isMember = community.members.some(id => id.equals(currentUser._id));

    if (action === 'join' && isMember) {
      return NextResponse.json(
        { error: 'User is already a member of this community' },
        { status: 400 }
      );
    }

    if (action === 'leave' && !isMember) {
      return NextResponse.json(
        { error: 'User is not a member of this community' },
        { status: 400 }
      );
    }

    // Update community and user based on action
    if (action === 'join') {
      // Add user to community members
      await Community.findByIdAndUpdate(
        params.communityId,
        { $push: { members: currentUser._id } }
      );

      // Add community to user's communities
      await User.findByIdAndUpdate(
        currentUser._id,
        { $push: { communities: community._id } }
      );
    } else if (action === 'leave') {
      // Remove user from community members
      await Community.findByIdAndUpdate(
        params.communityId,
        { $pull: { members: currentUser._id } }
      );

      // Remove user from moderators if they are a moderator
      if (community.moderators.some(id => id.equals(currentUser._id))) {
        await Community.findByIdAndUpdate(
          params.communityId,
          { $pull: { moderators: currentUser._id } }
        );
      }

      // Remove community from user's communities
      await User.findByIdAndUpdate(
        currentUser._id,
        { $pull: { communities: community._id } }
      );
    }

    // Get updated community
    const updatedCommunity = await Community.findById(params.communityId);

    return NextResponse.json({
      success: true,
      action,
      memberCount: updatedCommunity.members.length,
      isMember: action === 'join'
    });
  } catch (error) {
    console.error(`Error ${req.method} community membership:`, error);
    return NextResponse.json(
      { error: `Failed to ${req.method} community membership` },
      { status: 500 }
    );
  }
}
