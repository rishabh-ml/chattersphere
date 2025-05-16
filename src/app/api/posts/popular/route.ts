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
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  comments: Types.ObjectId[];
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

    // compute time threshold
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

    const now = Date.now();
    const cacheKey = `${timeRange}-${page}-${limit}`;
    const useCache =
        page === 1 &&
        cachedPosts?.cacheKey === cacheKey &&
        now - lastCacheTime < CACHE_TTL;

    let raw: unknown[];
    if (useCache) {
      console.log("[POPULAR] using cache");
      raw = cachedPosts!.posts;
    } else {
      console.log("[POPULAR] fetching fresh");
      raw = (await Post.find({ createdAt: { $gte: threshold } })
          .populate("author", "username name image")
          .populate("community", "name image")
          .lean()) as unknown[];
      if (page === 1) {
        // build and cache scored posts
        const buildCache = (raw as unknown[]).map((p) => {
          const post = p as CachedPost;
          return {
            ...post,
            score: calculateScore(
                post.upvotes.length,
                post.downvotes.length,
                post.createdAt
            ),
          };
        });
        cachedPosts = { posts: buildCache, cacheKey };
        lastCacheTime = now;
      }
    }

    // ensure we have scores
    const scored = (raw as CachedPost[]).map((post) => ({
      ...post,
      score:
          typeof post.score === "number"
              ? post.score
              : calculateScore(
                  post.upvotes.length,
                  post.downvotes.length,
                  post.createdAt
              ),
    }));

    // sort by score desc
    scored.sort((a, b) => b.score - a.score);

    const pagePosts = scored.slice(skip, skip + limit);

    // load user for vote flags and saved posts
    let me: Types.ObjectId | null = null;
    let user = null;
    if (userId) {
      user = await User.findOne({ clerkId: userId });
      if (user) me = user._id as Types.ObjectId;
    }

    // transform for API
    const transformed = pagePosts.map((post) => {
      const {
        _id,
        author,
        community,
        upvotes,
        downvotes,
        comments,
        createdAt,
        updatedAt,
        score,
        content,
      } = post;

      // flatten author
      let authorInfo: {
        id: string;
        username?: string;
        name?: string;
        image?: string;
      };
      if (typeof author === "object" && "username" in author) {
        authorInfo = {
          id: author._id.toString(),
          username: author.username,
          name: author.name,
          image: author.image,
        };
      } else {
        authorInfo = { id: author.toString() };
      }

      // flatten community
      let communityInfo: { id: string; name?: string; image?: string } | undefined;
      if (community) {
        if (typeof community === "object" && "name" in community) {
          communityInfo = {
            id: community._id.toString(),
            name: community.name,
            image: community.image,
          };
        } else {
          communityInfo = { id: community.toString() };
        }
      }

      const isUp = me
          ? upvotes.some((id) => id.equals(me))
          : false;
      const isDown = me
          ? downvotes.some((id) => id.equals(me))
          : false;

      // Check if the post is saved by the user
      const isSaved = me && user ? user.savedPosts.some((id) => id.equals(_id)) : false;

      return {
        id: _id.toString(),
        author: authorInfo,
        community: communityInfo,
        content,
        upvoteCount: upvotes.length,
        downvoteCount: downvotes.length,
        voteCount: upvotes.length - downvotes.length,
        commentCount: comments.length,
        isUpvoted: isUp,
        isDownvoted: isDown,
        isSaved,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        popularityScore: score.toFixed(2),
      };
    });

    return NextResponse.json(
        {
          posts: transformed,
          pagination: {
            page,
            limit,
            totalPosts: scored.length,
            hasMore: scored.length > skip + limit,
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
