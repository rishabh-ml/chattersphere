// src/app/api/users/[userId]/following/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { withCache, CacheKeys, CacheTTL } from "@/lib/redis";

/**
 * GET /api/users/[userId]/following - Get users that a user is following
 */
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    // Get the target user ID from the URL params
    const targetUserId = sanitizeInput(params.userId);
    
    // Get the current user's Clerk ID
    const { userId: clerkUserId } = await auth();
    
    // Connect to the database
    await connectToDatabase();
    
    // Create a cache key
    const cacheKey = `${CacheKeys.USER}${targetUserId}:following`;
    
    // Use cache wrapper with a TTL of 5 minutes
    const result = await withCache(
      cacheKey,
      async () => {
        // Find the target user
        const targetUser = await User.findById(targetUserId)
          .select("username name following")
          .lean();
        
        if (!targetUser) {
          throw new Error("User not found");
        }
        
        // Find all users that the target user is following
        const following = await User.find({
          _id: { $in: targetUser.following }
        })
        .select("username name image")
        .lean();
        
        // Find the current user if authenticated
        let currentUser = null;
        if (clerkUserId) {
          currentUser = await User.findOne({ clerkId: clerkUserId })
            .select("following")
            .lean();
        }
        
        // Format the following users for the response
        const formattedFollowing = following.map(followedUser => ({
          id: followedUser._id.toString(),
          username: followedUser.username,
          name: followedUser.name,
          image: followedUser.image,
          isFollowing: currentUser 
            ? currentUser.following.some((id: mongoose.Types.ObjectId) => 
                id.toString() === followedUser._id.toString()
              )
            : false
        }));
        
        return {
          username: targetUser.username,
          following: formattedFollowing
        };
      },
      CacheTTL.USER // 5 minutes TTL
    );
    
    // Return the result
    return NextResponse.json(result);
  } catch (err) {
    console.error("[FOLLOWING] Error:", err);
    return NextResponse.json({ error: "Failed to fetch following" }, { status: 500 });
  }
}
