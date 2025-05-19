import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import type { Types } from "mongoose";
import "@/models/Community";
import { withCache, invalidateCache } from "@/lib/redis";
import { env } from "@/lib/env";

type RawPost = {
  _id: Types.ObjectId;
  upvotes?: Types.ObjectId[];
  downvotes?: Types.ObjectId[];
  comments?: unknown[];
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const qp = req.nextUrl.searchParams;
    const page = parseInt(qp.get("page") ?? "1", 10);
    const limit = parseInt(qp.get("limit") ?? "10", 10);
    const skip = (page - 1) * limit;

    // Create a cache key based on user ID and pagination params
    const cacheKey = `feed:${userId}:page:${page}:limit:${limit}`;

    // Use cache wrapper with a TTL of 5 minutes
    const result = await withCache(
      cacheKey,
      async () => {
        const currentUser = await User.findOne({ clerkId: userId });
        if (!currentUser) {
          console.error(`User with clerkId ${userId} not found`);
          // Return empty result instead of throwing
          return {
            posts: [],
            pagination: { page, limit, totalPosts: 0, hasMore: false }
          };
        }

        const queryCondition =
            currentUser.following.length > 0
                ? { author: { $in: currentUser.following } }
                : {}; // If no following, show all posts

        const postsRaw = (await Post.find(queryCondition)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("author", "username name image")
            .populate("community", "name image")
            .lean()) as unknown as RawPost[];

        const totalPosts = await Post.countDocuments(queryCondition);
        const hasMore = totalPosts > skip + postsRaw.length;

        const me = currentUser._id as Types.ObjectId;
        const transformed = postsRaw.map((post) => {
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

        return { posts: transformed, pagination: { page, limit, totalPosts, hasMore } };
      },
      300 // 5 minutes TTL
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Error fetching home feed:", err);

    // Provide more detailed error message
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error details:", errorMessage);

    return NextResponse.json(
        {
          error: "Failed to fetch home feed",
          details: errorMessage,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
    );
  }
}
