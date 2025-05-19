import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Community from "@/models/Community";
import Membership, { MembershipStatus } from "@/models/Membership";
import mongoose, { Types } from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { withCache } from "@/lib/redis";
import { readOptions, getPaginationOptions, formatPaginationMetadata, buildPaginatedAggregation } from "@/lib/mongooseUtils";
import { withApiMiddleware } from "@/lib/apiUtils";

// Type for a populated post document
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

// GET /api/communities/[communityId]/posts - Get posts for a community
async function getCommunityPostsHandler(
  req: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const { userId } = await auth();

    // Sanitize and validate communityId
    if (!params?.communityId) {
      return NextResponse.json({ error: "Missing communityId parameter" }, { status: 400 });
    }

    const sanitizedCommunityId = sanitizeInput(params.communityId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId)) {
      return NextResponse.json({ error: "Invalid communityId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Check if community exists
    const community = await Community.findById(sanitizedCommunityId);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check if the community is private
    if (community.isPrivate) {
      // If private, user must be authenticated
      if (!userId) {
        console.log(`[COMMUNITIES POSTS GET] Unauthorized access attempt to private community: ${sanitizedCommunityId}`);
        return NextResponse.json({
          error: "You must be signed in to view posts in this private community"
        }, { status: 401 });
      }

      // Get the user's MongoDB ID
      const user = await User.findOne({ clerkId: userId });
      if (!user) {
        console.log(`[COMMUNITIES POSTS GET] User not found for clerkId: ${userId}`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Check if the user is a member of the community using Membership model
      const membership = await Membership.findOne({
        user: user._id,
        community: sanitizedCommunityId,
        status: 'ACTIVE'
      });

      // Fallback to the deprecated array if Membership model check fails
      const isMember = membership || community.members.some(memberId =>
        memberId.toString() === user._id.toString()
      );

      if (!isMember) {
        console.log(`[COMMUNITIES POSTS GET] Forbidden access attempt by user ${user._id} to private community: ${sanitizedCommunityId}`);
        return NextResponse.json({
          error: "You are not authorized to view posts in this private community"
        }, { status: 403 });
      }

      console.log(`[COMMUNITIES POSTS GET] Authorized access to private community ${sanitizedCommunityId} by member ${user._id}`);
    }

    // Parse query parameters
    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);

    // Use pagination utility
    const { skip, limit: validLimit } = getPaginationOptions(page, limit);

    // Create a cache key based on the request parameters
    const cacheKey = `community:${sanitizedCommunityId}:posts:page:${page}:limit:${validLimit}${userId ? `:user:${userId}` : ''}`;

    // Use cache wrapper with a TTL of 2 minutes
    const result = await withCache(
      cacheKey,
      async () => {
        // Build aggregation pipeline
        const lookupStages = [
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
          { $unwind: "$communityInfo" }
        ];

        const pipeline = buildPaginatedAggregation(
          { community: new Types.ObjectId(sanitizedCommunityId) },
          { createdAt: -1 },
          page,
          validLimit,
          lookupStages
        );

        const [aggregateResult] = await Post.aggregate(pipeline);

        const total = aggregateResult.metadata.length > 0 ? aggregateResult.metadata[0].total : 0;
        const posts = aggregateResult.data;

        // Get current user for vote status and saved status
        let currentUser = null;
        if (userId) {
          currentUser = await User.findOne({ clerkId: userId }).lean(true);
        }

        return { posts, total, currentUser };
      },
      120 // 2 minutes TTL
    );

    const { posts, total, currentUser } = result;

    // Format posts for response
    const formattedPosts = posts.map(post => {
      const isUpvoted = currentUser
        ? post.upvotes.some(id => id.toString() === currentUser._id.toString())
        : false;
      const isDownvoted = currentUser
        ? post.downvotes.some(id => id.toString() === currentUser._id.toString())
        : false;
      const isSaved = currentUser
        ? currentUser.savedPosts.some(id => id.toString() === post._id.toString())
        : false;

      return {
        id: post._id.toString(),
        author: {
          id: post.author._id.toString(),
          username: post.author.username,
          name: post.author.name,
          image: post.author.image,
        },
        content: post.content,
        community: {
          id: post.community._id.toString(),
          name: post.community.name,
          image: post.community.image,
        },
        upvoteCount: post.upvotes.length,
        downvoteCount: post.downvotes.length,
        voteCount: post.upvotes.length - post.downvotes.length,
        commentCount: post.comments.length,
        isUpvoted,
        isDownvoted,
        isSaved,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(
      {
        posts: formattedPosts,
        pagination: formatPaginationMetadata(page, validLimit, total),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/communities/[communityId]/posts] Error:", error);
    return NextResponse.json({ error: "Failed to fetch community posts" }, { status: 500 });
  }
}

// Export the handler function with middleware
export const GET = withApiMiddleware(
  (req: NextRequest) => getCommunityPostsHandler(req, { params: { communityId: req.nextUrl.pathname.split('/')[3] } }),
  {
    enableRateLimit: true,
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    identifier: 'community:posts:get'
  }
);
