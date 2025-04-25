import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import connectToDatabase from '@/lib/DbConnect';
import User from '@/models/User';

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: clerkUserId } = auth();

    if (!clerkUserId) {
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
    if (action !== 'follow' && action !== 'unfollow') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Find the current user
    const currentUser = await User.findOne({ clerkId: clerkUserId });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the target user
    const targetUser = await User.findById(params.userId);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Check if user is trying to follow themselves
    if (currentUser._id.equals(targetUser._id)) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if user is already following the target
    const isFollowing = currentUser.following.some(id => id.equals(targetUser._id));

    if (action === 'follow' && isFollowing) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      );
    }

    if (action === 'unfollow' && !isFollowing) {
      return NextResponse.json(
        { error: 'Not following this user' },
        { status: 400 }
      );
    }

    // Update following/followers based on action
    if (action === 'follow') {
      // Add target to current user's following
      await User.findByIdAndUpdate(
        currentUser._id,
        { $push: { following: targetUser._id } }
      );

      // Add current user to target's followers
      await User.findByIdAndUpdate(
        targetUser._id,
        { $push: { followers: currentUser._id } }
      );
    } else if (action === 'unfollow') {
      // Remove target from current user's following
      await User.findByIdAndUpdate(
        currentUser._id,
        { $pull: { following: targetUser._id } }
      );

      // Remove current user from target's followers
      await User.findByIdAndUpdate(
        targetUser._id,
        { $pull: { followers: currentUser._id } }
      );
    }

    // Get updated counts
    const updatedCurrentUser = await User.findById(currentUser._id);
    const updatedTargetUser = await User.findById(targetUser._id);

    return NextResponse.json({
      success: true,
      action,
      following: updatedCurrentUser.following.length,
      followers: updatedTargetUser.followers.length,
      isFollowing: action === 'follow'
    });
  } catch (error) {
    console.error(`Error ${req.method} user follow:`, error);
    return NextResponse.json(
      { error: `Failed to ${req.method} user follow` },
      { status: 500 }
    );
  }
}
