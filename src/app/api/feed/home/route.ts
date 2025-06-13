// src/app/api/feed/home/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Community from "@/models/Community";
import mongoose, { Types } from "mongoose";
import { withCache, CacheKeys, CacheTTL } from "@/lib/redis";
import { sanitizeInput } from "@/lib/security";

// Type for a raw post document from MongoDB
type RawPost = {
  _id: Types.ObjectId;
  author: {
    _id: Types.ObjectId;
    username: string;
    name: string;
    image?: string;
  };
  community?: {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    image?: string;
  };
  content: string;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  comments: Types.ObjectId[];
  mediaUrls: string[];
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
};

/**
 * GET /api/feed/home - Get personalized home feed
 * 
 * Returns posts from:
 * 1. Communities the user has joined
 * 2. Users the user is following
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Number of posts per page (default: 10)
 * - type: Filter by post source (following|joined|all, default: all)
 * - sort: Sort order (new|top|trending, default: new)
 */
export async function GET(req: NextRequest) {
  try {
    // Get the current user's Clerk ID
    const { userId } = await auth();
    
    // Check if the user is authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Parse query parameters
    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);
    const type = sanitizeInput(url.searchParams.get("type") ?? "all");
    const sort = sanitizeInput(url.searchParams.get("sort") ?? "new");
    
    // Validate query parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }
    
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
    }
    
    if (!["following", "joined", "all"].includes(type)) {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }
    
    if (!["new", "top", "trending"].includes(sort)) {
      return NextResponse.json({ error: "Invalid sort parameter" }, { status: 400 });
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Create a cache key based on user ID and query parameters
    const cacheKey = `${CacheKeys.FEED}${userId}:page:${page}:limit:${limit}:type:${type}:sort:${sort}`;
    
    // Use cache wrapper with a TTL of 1 minute
    const result = await withCache(
      cacheKey,
      async () => {
        // Find the current user
        const currentUser = await User.findOne({ clerkId: userId });
        
        if (!currentUser) {
          throw new Error("User not found");
        }
        
        // Build query conditions based on the type parameter
        const queryConditions: mongoose.FilterQuery<any>[] = [];
        
        // If type is "all" or "following", include posts from followed users
        if (type === "all" || type === "following") {
          if (currentUser.following.length > 0) {
            queryConditions.push({ author: { $in: currentUser.following } });
          }
        }
        
        // If type is "all" or "joined", include posts from joined communities
        if (type === "all" || type === "joined") {
          if (currentUser.communities.length > 0) {
            queryConditions.push({ community: { $in: currentUser.communities } });
          }
        }
        
        // If no conditions (user doesn't follow anyone or hasn't joined any communities),
        // fall back to popular posts
        let query: mongoose.FilterQuery<any> = {};
        
        if (queryConditions.length > 0) {
          query = { $or: queryConditions };
        } else {
          // Fallback to popular posts (posts with most upvotes)
          // No specific filtering, will be sorted by popularity
        }
        
        // Determine sort order
        let sortOptions: any = {};
        
        switch (sort) {
          case "top":
            // Sort by upvote count (most upvotes first)
            sortOptions = { upvoteCount: -1, createdAt: -1 };
            break;
          case "trending":
            // Sort by a combination of recency and popularity
            // This is a simple implementation - could be more sophisticated
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            
            // Only include posts from the last two weeks for trending
            query.createdAt = { $gte: twoWeeksAgo };
            
            // Sort by a combination of upvotes and recency
            sortOptions = { 
              $expr: { 
                $divide: [
                  { $subtract: [{ $size: "$upvotes" }, { $size: "$downvotes" }] },
                  { $add: [
                    { $divide: [{ $subtract: [new Date(), "$createdAt"] }, 1000 * 60 * 60 * 24] }, // Days since creation
                    1 // Avoid division by zero
                  ]}
                ]
              }
            };
            break;
          case "new":
          default:
            // Sort by creation date (newest first)
            sortOptions = { createdAt: -1 };
            break;
        }
        
        // Fetch posts with pagination
        const postsRaw = await Post.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate("author", "username name image")
          .populate("community", "name slug image")
          .lean() as RawPost[];
        
        // Count total posts for pagination
        const totalPosts = await Post.countDocuments(query);
        
        // Check if there are more posts
        const hasMore = totalPosts > skip + postsRaw.length;
        
        // Transform posts for the response
        const me = currentUser._id;
        const transformedPosts = postsRaw.map((post) => {
          const {
            _id,
            upvotes = [],
            downvotes = [],
            comments = [],
            createdAt,
            updatedAt,
            ...rest
          } = post;
          
          return {
            id: _id.toString(),
            ...rest,
            upvoteCount: upvotes.length,
            downvoteCount: downvotes.length,
            voteCount: upvotes.length - downvotes.length,
            commentCount: comments.length,
            isUpvoted: upvotes.some((id: Types.ObjectId) => id.equals(me)),
            isDownvoted: downvotes.some((id: Types.ObjectId) => id.equals(me)),
            isSaved: currentUser.savedPosts.some((id: Types.ObjectId) => id.equals(_id)),
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString(),
          };
        });
        
        // Return the result
        return {
          posts: transformedPosts,
          pagination: {
            page,
            limit,
            totalPosts,
            hasMore,
          },
          feedType: queryConditions.length > 0 ? type : "popular",
        };
      },
      CacheTTL.FEED // 1 minute TTL
    );
    
    // Return the result
    return NextResponse.json(result);
  } catch (err) {
    console.error("[HOME FEED] Error:", err);
    return NextResponse.json({ error: "Failed to fetch home feed" }, { status: 500 });
  }
}
