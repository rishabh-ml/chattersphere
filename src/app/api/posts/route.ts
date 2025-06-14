// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose, { Types } from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Community from "@/models/Community";
import { invalidateCache, withCache } from "@/lib/redis";
import { z } from "zod";
import {
  readOptions,
  getPaginationOptions,
  formatPaginationMetadata,
  buildPaginatedAggregation,
} from "@/lib/mongooseUtils";
import { withApiMiddleware } from "@/lib/apiUtils";

type RawPost = {
  _id: Types.ObjectId;
  author:
    | Types.ObjectId
    | {
        _id: Types.ObjectId;
        username: string;
        name: string;
        image?: string;
      };
  community?:
    | Types.ObjectId
    | {
        _id: Types.ObjectId;
        name: string;
        image?: string;
      };
  content: string;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  mediaUrls: string[];
  createdAt: Date;
  updatedAt: Date;
};

// Type for a populated post document
interface PopulatedPost {
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
    image?: string;
  };
  content: string;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  mediaUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Define the handler function
async function getPostsHandler(req: NextRequest) {
  try {
    console.log("[GET] Received request to fetch posts");

    const { userId } = await auth();
    console.log(`[GET] User ID from auth: ${userId || "not authenticated"}`);

    console.log("[GET] Connecting to database...");
    await dbConnect();
    console.log("[GET] Connected to database");

    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);
    const communityIdParam = url.searchParams.get("communityId") ?? undefined;

    // Use pagination utility
    const { skip, limit: validLimit } = getPaginationOptions(page, limit);

    console.log(
      `[GET] Fetching posts: page=${page}, limit=${validLimit}${communityIdParam ? `, communityId=${communityIdParam}` : ""}`
    );

    // Create a cache key based on the request parameters
    const cacheKey = `posts:${communityIdParam || "all"}:page:${page}:limit:${validLimit}${userId ? `:user:${userId}` : ""}`;

    // Use cache wrapper with a TTL of 2 minutes
    const result = await withCache(
      cacheKey,
      async () => {
        const matchStage: Record<string, unknown> = {};

        if (communityIdParam) {
          matchStage.community = new Types.ObjectId(communityIdParam);
        } else if (userId) {
          const me = (await User.findOne({ clerkId: userId }).select("_id").lean()) as {
            _id: Types.ObjectId;
          } | null;
          if (me) {
            const joined = (await Community.find({ members: me._id }).select("_id").lean()) as {
              _id: Types.ObjectId;
            }[];
            const joinedIds = joined.map((c) => c._id);
            if (joinedIds.length > 0) {
              matchStage.community = { $in: joinedIds };
            }
          }
        }

        // Define lookup stages for populating references
        const lookupStages = [
          // Lookup author information
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "authorInfo",
            },
          },
          { $unwind: "$authorInfo" },

          // Lookup community information if present
          {
            $lookup: {
              from: "communities",
              localField: "community",
              foreignField: "_id",
              as: "communityInfo",
            },
          },
          { $unwind: { path: "$communityInfo", preserveNullAndEmptyArrays: true } },
        ]; // Build and execute the aggregation pipeline
        const pipeline: any[] = buildPaginatedAggregation(
          matchStage,
          { createdAt: -1 },
          page,
          validLimit,
          lookupStages
        );

        const [result] = await Post.aggregate(pipeline);

        const total = result.metadata.length > 0 ? result.metadata[0].total : 0;
        const posts = result.data; // Get current user for determining vote status
        let meId: Types.ObjectId | null = null;
        if (userId) {
          const me = (await User.findOne({ clerkId: userId }).select("_id").lean()) as {
            _id: Types.ObjectId;
          } | null;
          if (me) meId = me._id;
        }

        return { posts, total, meId };
      },
      120 // 2 minutes TTL
    );

    const { posts: rawPosts, total, meId } = result; // Use async map to handle async operations inside
    const postsPromises = rawPosts.map(async (p: any) => {
      // Author
      let authorInfo: {
        id: string;
        username: string;
        name: string;
        image?: string;
      };
      if (typeof p.author === "object" && "_id" in p.author && "username" in p.author) {
        const a = p.author as {
          _id: Types.ObjectId;
          username: string;
          name: string;
          image?: string;
        };
        authorInfo = {
          id: a._id.toString(),
          username: a.username,
          name: a.name,
          image: a.image,
        };
      } else {
        authorInfo = { id: "", username: "", name: "" };
      }

      // Community
      let communityInfo:
        | {
            id: string;
            name: string;
            image?: string;
          }
        | undefined;
      if (
        p.community &&
        typeof p.community === "object" &&
        "_id" in p.community &&
        "name" in p.community
      ) {
        const c = p.community as {
          _id: Types.ObjectId;
          name: string;
          image?: string;
        };
        communityInfo = {
          id: c._id.toString(),
          name: c.name,
          image: c.image,
        };
      } else {
        communityInfo = undefined;
      }

      // Get vote status if user is logged in
      let isUpvoted = false;
      let isDownvoted = false;

      if (meId) {
        try {
          // Check if Vote model exists
          const Vote = mongoose.models.Vote;
          if (Vote) {
            // Use a synchronous approach to check vote status
            const userVote = await Vote.findOne({
              user: meId,
              target: p._id,
              targetType: "Post",
            }).exec();

            if (userVote) {
              isUpvoted = userVote.voteType === "UPVOTE";
              isDownvoted = userVote.voteType === "DOWNVOTE";
            }
          }
        } catch (error) {
          console.error("[GET] Error checking vote status:", error);
          // No fallback needed as we've already set defaults
        }      } // Check if the post is saved by the user
      // Note: Saved posts check is implemented via /api/posts/[postId]/save and /api/posts/saved endpoints
      // For performance reasons, we don't check saved status in the main posts feed
      const isSaved = false; // Set to false for performance - saved status checked separately when needed

      return {
        id: p._id.toString(),
        author: authorInfo,
        content: p.content,
        community: communityInfo,
        upvoteCount: p.upvoteCount || 0,
        downvoteCount: p.downvoteCount || 0,
        voteCount: (p.upvoteCount || 0) - (p.downvoteCount || 0),
        commentCount: p.commentCount || 0,
        mediaUrls: p.mediaUrls || [],
        isUpvoted,
        isDownvoted,
        isSaved,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    // Resolve all promises
    const posts = await Promise.all(postsPromises);

    return NextResponse.json(
      {
        posts,
        pagination: formatPaginationMetadata(page, validLimit, total),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET] Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// Define validation schema for post creation
const postCreateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post content is required")
    .max(50000, "Post too long; max 50000 chars"),
  communityId: z.string().optional(),
  mediaUrls: z.array(z.string().url("Invalid media URL")).optional(),
});

// Define the handler function
async function createPostHandler(req: NextRequest) {
  try {
    console.log("[POST] Received post creation request");

    const { userId } = await auth();
    if (!userId) {
      console.log("[POST] Unauthorized request - no userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[POST] Connecting to database...");
    await dbConnect();
    console.log("[POST] Connected to database");

    // Parse and validate request body
    const body = await req.json();
    const validationResult = postCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");

      return NextResponse.json(
        { error: "Validation error", details: errorMessage },
        { status: 400 }
      );
    }

    const { content, communityId, mediaUrls = [] } = validationResult.data;
    console.log(
      `[POST] Received content (${content.length} chars)${communityId ? ` for community ${communityId}` : ""}`
    );

    // Sanitize content to prevent XSS attacks
    const sanitized = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/g, "")
      .replace(/javascript:[^\s"']+/g, "");

    console.log(`[POST] Looking for user with clerkId: ${userId}`);
    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      console.log(`[POST] User with clerkId ${userId} not found in database`);

      // Create a new user if not found
      console.log(`[POST] Attempting to create a new user for clerkId: ${userId}`);
      try {
        // This is a fallback mechanism - ideally the webhook should create the user
        const newUser = await User.create({
          clerkId: userId,
          username: `user_${userId.slice(0, 8)}`,
          name: `User ${userId.slice(0, 6)}`,
          email: `user_${userId.slice(0, 8)}@example.com`,
          following: [],
          followers: [],
          communities: [],
        });

        console.log(`[POST] Created new user with id: ${newUser._id}`);
        user = newUser;
      } catch (userCreateError) {
        console.error("[POST] Failed to create user:", userCreateError);
        return NextResponse.json(
          {
            error: "User not found and automatic creation failed",
            details: userCreateError instanceof Error ? userCreateError.message : "Unknown error",
          },
          { status: 404 }
        );
      }
    } else {
      console.log(`[POST] Found user: ${user.username} (${user._id})`);
    }

    // Check community membership first if posting to a community
    if (communityId) {
      const com = await Community.findById(communityId);
      if (!com) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }

      // Check if user is a member using the new Membership model
      const Membership = mongoose.models.Membership;
      const isMember = await Membership.findOne({
        user: user._id,
        community: communityId,
        status: "ACTIVE",
      });

      // Fallback to the old method if Membership check fails
      if (!isMember && !com.members.some((m: Types.ObjectId) => m.equals(user._id))) {
        return NextResponse.json({ error: "Must join community first" }, { status: 403 });
      }
    }

    // Create the post with the new schema
    const newPost = await Post.create({
      author: user._id,
      content: sanitized,
      upvoteCount: 0,
      downvoteCount: 0,
      commentCount: 0,
      mediaUrls: mediaUrls || [],
      community: communityId,
    });

    await newPost.populate("author", "username name image");
    if (communityId) {
      await newPost.populate("community", "name image");
    }

    // Cast to populated post type
    const populatedPost = newPost as unknown as PopulatedPost;

    // Invalidate feed caches
    await invalidateCache(`feed:${userId}:*`);

    // If post is in a community, invalidate that community's cache too
    if (communityId) {
      await invalidateCache(`community:${communityId}:*`);
    }

    return NextResponse.json(
      {
        post: {
          id: populatedPost._id.toString(),
          author: {
            id: populatedPost.author._id.toString(),
            username: populatedPost.author.username,
            name: populatedPost.author.name,
            image: populatedPost.author.image,
          },
          content: populatedPost.content,
          community: populatedPost.community
            ? {
                id: populatedPost.community._id.toString(),
                name: populatedPost.community.name,
                image: populatedPost.community.image,
              }
            : undefined,
          upvoteCount: 0,
          downvoteCount: 0,
          voteCount: 0,
          commentCount: 0,
          isUpvoted: false,
          isDownvoted: false,
          mediaUrls: populatedPost.mediaUrls || [],
          createdAt: newPost.createdAt.toISOString(),
          updatedAt: newPost.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST] Error creating post:", error);
    return NextResponse.json(
      {
        error: "Failed to create post",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Export the handler functions with middleware
export const GET = withApiMiddleware(getPostsHandler, {
  enableRateLimit: true,
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  identifier: "posts:get",
});

export const POST = withApiMiddleware(createPostHandler, {
  enableRateLimit: true,
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  identifier: "posts:post",
});
