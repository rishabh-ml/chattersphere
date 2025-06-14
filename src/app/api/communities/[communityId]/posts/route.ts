// src/app/api/communities/[communityId]/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Community from "@/models/Community";
import Membership, { MembershipStatus } from "@/models/Membership";
import mongoose, { Types, PipelineStage } from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { withCache } from "@/lib/redis";
import {
  getPaginationOptions,
  formatPaginationMetadata,
  buildPaginatedAggregation,
} from "@/lib/mongooseUtils";
import { withApiMiddleware } from "@/lib/apiUtils";

// The shape of each post after aggregation
interface PopulatedPost {
  _id: Types.ObjectId;
  author: {
    _id: Types.ObjectId;
    username: string;
    name: string;
    image?: string;
  };
  community: {
    _id: Types.ObjectId;
    name: string;
    image?: string;
  };
  content: string;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  comments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// What the aggregation returns
interface AggregationResult {
  metadata: { total: number }[];
  data: PopulatedPost[];
}

// Leaned current user for vote/saved checks
interface CurrentUserLean {
  _id: Types.ObjectId;
  savedPosts: Types.ObjectId[];
}

// Core handler
async function getCommunityPostsHandler(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const resolvedParams = await params;
  // 1) Fetch userId if signed in
  const { userId } = await auth().catch(() => ({ userId: null }));

  // 2) Validate & sanitize communityId
  const rawCommunityId = sanitizeInput(resolvedParams.communityId || "");
  if (!mongoose.isValidObjectId(rawCommunityId)) {
    return NextResponse.json({ error: "Missing or invalid communityId" }, { status: 400 });
  }

  await connectToDatabase();

  // 3) Ensure the community exists
  const community = await Community.findById(rawCommunityId);
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  // 4) If the community is private, enforce ACTIVE membership
  if (community.isPrivate) {
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to view this private community" },
        { status: 401 }
      );
    }
    const userDoc = await User.findOne({ clerkId: userId });
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const isMember = Boolean(
      await Membership.findOne({
        user: userDoc._id,
        community: community._id,
        status: MembershipStatus.ACTIVE,
      })
    );
    if (!isMember) {
      return NextResponse.json(
        { error: "Not authorized to view this private community" },
        { status: 403 }
      );
    }
  }

  // 5) Parse pagination
  const url = req.nextUrl;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);
  const { limit: validLimit } = getPaginationOptions(page, limit);

  // 6) Cache key
  const cacheKey = `comm:${rawCommunityId}:posts:p${page}:l${validLimit}${
    userId ? `:u${userId}` : ""
  }`;

  // 7) Fetch & cache
  const { posts, total, currentUser } = await withCache(
    cacheKey,
    async () => {
      // a) Build lookup stages
      const lookup: PipelineStage[] = [
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorInfo",
          },
        },
        { $unwind: "$authorInfo" },
        {
          $lookup: {
            from: "communities",
            localField: "community",
            foreignField: "_id",
            as: "communityInfo",
          },
        },
        { $unwind: "$communityInfo" },
      ];

      // b) Aggregation pipeline
      const pipeline = buildPaginatedAggregation(
        { community: new Types.ObjectId(rawCommunityId) },
        { createdAt: -1 },
        page,
        validLimit,
        lookup
      );

      // c) Run aggregation with explicit generic
      const [aggResult] = await Post.aggregate<AggregationResult>(pipeline as PipelineStage[]);

      const totalCount = aggResult.metadata[0]?.total ?? 0;
      const pagedPosts = aggResult.data;

      // d) Load current user for vote/saved
      let cu: CurrentUserLean | null = null;
      if (userId) {
        cu = (await User.findOne({ clerkId: userId })
          .select("_id savedPosts")
          .lean()) as CurrentUserLean | null;
      }

      return { posts: pagedPosts, total: totalCount, currentUser: cu };
    },
    120 // TTL in seconds
  );

  // 8) Format for response
  const formattedPosts = posts.map((p: PopulatedPost) => {
    const isUpvoted =
      currentUser?.savedPosts !== undefined
        ? p.upvotes.some((id) => id.equals(currentUser._id))
        : false;
    const isDownvoted = currentUser ? p.downvotes.some((id) => id.equals(currentUser._id)) : false;
    const isSaved = currentUser ? currentUser.savedPosts.some((id) => id.equals(p._id)) : false;

    return {
      id: p._id.toString(),
      author: {
        id: p.author._id.toString(),
        username: p.author.username,
        name: p.author.name,
        image: p.author.image ?? "",
      },
      community: {
        id: p.community._id.toString(),
        name: p.community.name,
        image: p.community.image ?? "",
      },
      content: p.content,
      upvoteCount: p.upvotes.length,
      downvoteCount: p.downvotes.length,
      voteCount: p.upvotes.length - p.downvotes.length,
      commentCount: p.comments.length,
      isUpvoted,
      isDownvoted,
      isSaved,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  });

  // 9) Return JSON
  return NextResponse.json(
    {
      posts: formattedPosts,
      pagination: formatPaginationMetadata(page, validLimit, total),
    },
    { status: 200 }
  );
}

// 10) Wrap with middleware
export const GET = withApiMiddleware(
  async (req) => {
    const communityId = req.nextUrl.pathname.split("/")[3];
    return getCommunityPostsHandler(req, { params: Promise.resolve({ communityId }) });
  },
  {
    enableRateLimit: true,
    maxRequests: 100,
    windowMs: 60_000,
    identifier: "community:posts:get",
  }
);
