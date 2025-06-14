// src/app/api/users/[userId]/follow/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { withCache, invalidateCache, CacheKeys } from "@/lib/redis";

/**
 * POST /api/users/[userId]/follow - Follow a user
 *
 * Adds the target user to the current user's following list
 * and adds the current user to the target user's followers list
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  try {
    // Get the target user ID from the URL params
    const targetUserId = sanitizeInput(resolvedParams.userId);

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

    // Prevent following self
    if (currentUser._id.equals(targetUser._id)) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    // Check if the target user allows followers
    if (targetUser.privacySettings?.allowFollowers === false) {
      return NextResponse.json({ error: "This user does not allow followers" }, { status: 403 });
    }

    // Check if already following
    const alreadyFollowing = currentUser.following.some((id: mongoose.Types.ObjectId) =>
      id.equals(targetUser._id)
    );

    // If already following, return success without making changes
    if (alreadyFollowing) {
      return NextResponse.json({
        success: true,
        isFollowing: true,
        followerCount: targetUser.followers.length,
        message: "Already following this user",
      });
    }

    // Add target user to current user's following list
    currentUser.following.push(targetUser._id);

    // Add current user to target user's followers list
    targetUser.followers.push(currentUser._id);

    // Create notification for new follow
    try {
      const Notification = mongoose.model("Notification");
      await Notification.create({
        recipient: targetUser._id,
        sender: currentUser._id,
        type: "follow",
        message: `${currentUser.name} started following you`,
        read: false,
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Continue even if notification creation fails
    }

    // Save both users
    await currentUser.save();
    await targetUser.save();

    // Invalidate cache for both users' feeds
    await invalidateCache(`${CacheKeys.FEED}${clerkUserId}:*`);

    // Return success response
    return NextResponse.json({
      success: true,
      isFollowing: true,
      user: {
        id: targetUser._id.toString(),
        username: targetUser.username,
        name: targetUser.name,
        followerCount: targetUser.followers.length,
      },
    });
  } catch (err) {
    console.error("[FOLLOW] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
