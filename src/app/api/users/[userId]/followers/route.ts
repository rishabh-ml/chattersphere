// src/app/api/users/[userId]/followers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { withCache, CacheKeys, CacheTTL } from "@/lib/redis";

/**
 * GET /api/users/[userId]/followers - Get a user's followers
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  try {
    // Get the target user ID from the URL params
    const targetUserId = sanitizeInput(resolvedParams.userId);
    
    // Get the current user's Clerk ID
    const { userId: clerkUserId } = await auth();
    
    // Connect to the database
    await connectToDatabase();
    
    // Create a cache key
    const cacheKey = `${CacheKeys.USER}${targetUserId}:followers`;
    
    // Use cache wrapper with a TTL of 5 minutes
    const result = await withCache(
      cacheKey,
      async () => {        // Find the target user
        const targetUser = await User.findById(targetUserId)
          .select("username name followers")
          .lean() as any;
        
        if (!targetUser) {
          throw new Error("User not found");
        }
        
        // Find all followers
        const followers = await User.find({
          _id: { $in: targetUser.followers }
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
        
        // Format the followers for the response
        const formattedFollowers = followers.map(follower => ({
          id: follower._id.toString(),
          username: follower.username,
          name: follower.name,
          image: follower.image,
          isFollowing: currentUser 
            ? currentUser.following.some((id: mongoose.Types.ObjectId) => 
                id.toString() === follower._id.toString()
              )
            : false
        }));
        
        return {
          username: targetUser.username,
          followers: formattedFollowers
        };
      },
      CacheTTL.USER // 5 minutes TTL
    );
    
    // Return the result
    return NextResponse.json(result);
  } catch (err) {
    console.error("[FOLLOWERS] Error:", err);
    return NextResponse.json({ error: "Failed to fetch followers" }, { status: 500 });
  }
}
