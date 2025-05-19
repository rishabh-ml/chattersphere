// src/app/api/posts/popular/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import type { Types } from "mongoose";

let isConnected = false;

const DECAY_FACTOR = 45000; // ~12.5 hours half-life
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedPost {
  _id: Types.ObjectId;
  author:
      | Types.ObjectId
      | { _id: Types.ObjectId; username: string; name: string; image?: string };
  content: string;
  community?:
      | Types.ObjectId
      | { _id: Types.ObjectId; name: string; image?: string };
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  score: number;
}

let cachedPosts: { posts: CachedPost[]; cacheKey: string } | null = null;
let lastCacheTime = 0;

function calculateScore(
    upvotes: number,
    downvotes: number,
    createdAt: Date
): number {
  const voteScore = upvotes - downvotes;
  const ageMs = Date.now() - createdAt.getTime();
  return voteScore / Math.pow(1 + ageMs / DECAY_FACTOR, 1.5);
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!isConnected) {
      await dbConnect();
      isConnected = true;
      console.log("[POPULAR] DB connected");
    }

    const qp = req.nextUrl.searchParams;
    const page = parseInt(qp.get("page") ?? "1", 10);
    const limit = parseInt(qp.get("limit") ?? "10", 10);
    const timeRange = qp.get("timeRange") ?? "day";
    const skip = (page - 1) * limit;

    // Compute time threshold
    const threshold = new Date();
    switch (timeRange) {
      case "day":
        threshold.setDate(threshold.getDate() - 1);
        break;
      case "week":
        threshold.setDate(threshold.getDate() - 7);
        break;
      case "month":
        threshold.setMonth(threshold.getMonth() - 1);
        break;
      case "all":
        threshold.setTime(0);
        break;
    }

    // Get current user for vote status and saved status
    let currentUser = null;
    if (userId) {
      currentUser = await User.findOne({ clerkId: userId }).lean();
    }

    // Use MongoDB aggregation pipeline for efficient database-level operations
    const now = Date.now();

    // Build the aggregation pipeline
    const aggregationPipeline = [
      // Match posts within the time range
      { $match: { createdAt: { $gte: threshold } } },

      // Add computed fields
      { $addFields: {
        upvoteCount: { $size: { $ifNull: ["$upvotes", []] } },
        downvoteCount: { $size: { $ifNull: ["$downvotes", []] } },
        commentCount: { $size: { $ifNull: ["$comments", []] } },
        voteCount: { $subtract: [{ $size: { $ifNull: ["$upvotes", []] } }, { $size: { $ifNull: ["$downvotes", []] } }] },
        ageMs: { $subtract: [now, { $toLong: "$createdAt" }] }
      }},

      // Calculate popularity score
      { $addFields: {
        score: {
          $divide: [
            "$voteCount",
            { $pow: [
              { $add: [1, { $divide: ["$ageMs", DECAY_FACTOR] }] },
              1.5
            ]}
          ]
        }
      }},

      // Sort by score (descending)
      { $sort: { score: -1 } },

      // Count total before pagination
      { $facet: {
        totalCount: [{ $count: "count" }],
        paginatedResults: [
          { $skip: skip },
          { $limit: limit },
          // Lookup author information
          { $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorInfo"
          }},
          { $unwind: "$authorInfo" },

          // Lookup community information
          { $lookup: {
            from: "communities",
            localField: "community",
            foreignField: "_id",
            as: "communityInfo"
          }},
          { $unwind: { path: "$communityInfo", preserveNullAndEmptyArrays: true } }
        ]
      }}
    ];

    // Execute the aggregation pipeline
    const [result] = await Post.aggregate(aggregationPipeline);

    const totalPosts = result.totalCount.length > 0 ? result.totalCount[0].count : 0;
    const posts = result.paginatedResults;

    // Transform the results for the API response
    const transformed = posts.map(post => {
      // Check if the post is upvoted by the current user
      const isUpvoted = currentUser ?
        post.upvotes?.some(id => id.toString() === currentUser._id.toString()) || false :
        false;

      // Check if the post is downvoted by the current user
      const isDownvoted = currentUser ?
        post.downvotes?.some(id => id.toString() === currentUser._id.toString()) || false :
        false;

      // Check if the post is saved by the current user
      const isSaved = currentUser ?
        currentUser.savedPosts?.some(id => id.toString() === post._id.toString()) || false :
        false;

      return {
        id: post._id.toString(),
        author: {
          id: post.authorInfo._id.toString(),
          username: post.authorInfo.username,
          name: post.authorInfo.name,
          image: post.authorInfo.image,
        },
        community: post.communityInfo ? {
          id: post.communityInfo._id.toString(),
          name: post.communityInfo.name,
          image: post.communityInfo.image,
        } : undefined,
        content: post.content,
        upvoteCount: post.upvoteCount,
        downvoteCount: post.downvoteCount,
        voteCount: post.voteCount,
        commentCount: post.commentCount,
        isUpvoted,
        isDownvoted,
        isSaved,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        popularityScore: post.score.toFixed(2),
      };
    });

    return NextResponse.json(
      {
        posts: transformed,
        pagination: {
          page,
          limit,
          totalPosts,
          hasMore: totalPosts > skip + limit,
        },
        timeRange,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POPULAR] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch popular posts" },
      { status: 500 }
    );
  }
}
