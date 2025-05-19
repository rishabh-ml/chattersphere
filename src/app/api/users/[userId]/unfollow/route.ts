// src/app/api/users/[userId]/unfollow/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { invalidateCache, CacheKeys } from "@/lib/redis";

/**
 * DELETE /api/users/[userId]/unfollow - Unfollow a user
 * 
 * Removes the target user from the current user's following list
 * and removes the current user from the target user's followers list
 */
export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    // Get the target user ID from the URL params
    const targetUserId = sanitizeInput(params.userId);
    
    // Get the current user's Clerk ID
    const { userId: clerkUserId } = await auth();

    // Check if the user is authenticated
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Find the current user and target user
    const currentUser = await User.findOne({ clerkId: clerkUserId });
    const targetUser = await User.findById(targetUserId);

    // Check if both users exist
    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if actually following
    const isFollowing = currentUser.following.some(
      (id: mongoose.Types.ObjectId) => id.equals(targetUser._id)
    );

    // If not following, return success without making changes
    if (!isFollowing) {
      return NextResponse.json({
        success: true,
        isFollowing: false,
        followerCount: targetUser.followers.length,
        message: "Not following this user"
      });
    }

    // Remove target user from current user's following list
    currentUser.following = currentUser.following.filter(
      (id: mongoose.Types.ObjectId) => !id.equals(targetUser._id)
    );
    
    // Remove current user from target user's followers list
    targetUser.followers = targetUser.followers.filter(
      (id: mongoose.Types.ObjectId) => !id.equals(currentUser._id)
    );

    // Save both users
    await currentUser.save();
    await targetUser.save();

    // Invalidate cache for the current user's feed
    await invalidateCache(`${CacheKeys.FEED}${clerkUserId}:*`);

    // Return success response
    return NextResponse.json({
      success: true,
      isFollowing: false,
      user: {
        id: targetUser._id.toString(),
        username: targetUser.username,
        name: targetUser.name,
        followerCount: targetUser.followers.length
      }
    });
  } catch (err) {
    console.error("[UNFOLLOW] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
