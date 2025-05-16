// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Community from "@/models/Community";
import { Types } from "mongoose";
import { invalidateCache } from "@/lib/redis";
import { z } from "zod";
import { rateLimit } from "@/middleware/rateLimit";

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
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  comments: Types.ObjectId[];
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
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  comments: Types.ObjectId[];
  mediaUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  try {
    console.log('[GET] Received request to fetch posts');

    const { userId } = await auth();
    console.log(`[GET] User ID from auth: ${userId || 'not authenticated'}`);

    console.log('[GET] Connecting to database...');
    await dbConnect();
    console.log('[GET] Connected to database');

    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);
    const communityIdParam = url.searchParams.get("communityId") ?? undefined;
    const skip = (page - 1) * limit;

    console.log(`[GET] Fetching posts: page=${page}, limit=${limit}${communityIdParam ? `, communityId=${communityIdParam}` : ''}`);


    const filter: Record<string, unknown> = {};

    if (communityIdParam) {
      filter.community = new Types.ObjectId(communityIdParam);
    } else if (userId) {
      const me = await User.findOne({ clerkId: userId }).select("_id");
      if (me) {
        const joined = await Community.find({ members: me._id }).select("_id");
        const joinedIds = joined.map((c: { _id: Types.ObjectId }) => c._id);
        filter.community = { $in: joinedIds };
      }
    }

    // Fetch posts with error handling
    let rawPosts;
    try {
      rawPosts = await Post.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("author", "username name image")
          .populate("community", "name image")
          .lean<RawPost[]>();

      console.log(`[GET] Successfully fetched ${rawPosts.length} posts`);
    } catch (fetchError) {
      console.error('[GET] Error fetching posts:', fetchError);
      return NextResponse.json({
        error: "Failed to fetch posts",
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Count total posts
    let total;
    try {
      total = await Post.countDocuments(filter);
      console.log(`[GET] Total posts count: ${total}`);
    } catch (countError) {
      console.error('[GET] Error counting posts:', countError);
      return NextResponse.json({
        error: "Failed to count posts",
        details: countError instanceof Error ? countError.message : 'Unknown error'
      }, { status: 500 });
    }

    let meId: Types.ObjectId | null = null;
    if (userId) {
      const me = await User.findOne({ clerkId: userId }).select("_id");
      if (me) meId = me._id;
    }

    const posts = rawPosts.map((p) => {
      // Author
      let authorInfo: {
        id: string;
        username: string;
        name: string;
        image?: string;
      };
      if (
          typeof p.author === "object" &&
          "_id" in p.author &&
          "username" in p.author
      ) {
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

      const upvotes = p.upvotes ?? [];
      const downvotes = p.downvotes ?? [];
      const comments = p.comments ?? [];

      const isUpvoted = meId ? upvotes.some((u) => u.equals(meId)) : false;
      const isDownvoted = meId ? downvotes.some((d) => d.equals(meId)) : false;

      // Check if the post is saved by the user
      const isSaved = meId && user ? user.savedPosts.some((id) => id.equals(p._id)) : false;

      return {
        id: p._id.toString(),
        author: authorInfo,
        content: p.content,
        community: communityInfo,
        upvoteCount: upvotes.length,
        downvoteCount: downvotes.length,
        voteCount: upvotes.length - downvotes.length,
        commentCount: comments.length,
        mediaUrls: p.mediaUrls || [],
        isUpvoted,
        isDownvoted,
        isSaved,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(
        {
          posts,
          pagination: {
            page,
            limit,
            totalPosts: total,
            hasMore: total > skip + posts.length,
          },
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
  content: z.string().trim().min(1, "Post content is required").max(50000, "Post too long; max 50000 chars"),
  communityId: z.string().optional(),
  mediaUrls: z.array(z.string().url("Invalid media URL")).optional(),
});

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimit(req, {
    maxRequests: 10,  // 10 posts per minute
    windowMs: 60000,  // 1 minute
    identifier: 'posts:create'
  });

  // If rate limit response is not 'next', return it
  if (rateLimitResponse.status !== 200) {
    return rateLimitResponse;
  }

  try {
    console.log('[POST] Received post creation request');

    const { userId } = await auth();
    if (!userId) {
      console.log('[POST] Unauthorized request - no userId');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('[POST] Connecting to database...');
    await dbConnect();
    console.log('[POST] Connected to database');

    // Parse and validate request body
    const body = await req.json();
    const validationResult = postCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');

      return NextResponse.json(
        { error: "Validation error", details: errorMessage },
        { status: 400 }
      );
    }

    const { content, communityId, mediaUrls = [] } = validationResult.data;
    console.log(`[POST] Received content (${content.length} chars)${communityId ? ` for community ${communityId}` : ''}`);

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
          communities: []
        });

        console.log(`[POST] Created new user with id: ${newUser._id}`);
        user = newUser;
      } catch (userCreateError) {
        console.error('[POST] Failed to create user:', userCreateError);
        return NextResponse.json({
          error: "User not found and automatic creation failed",
          details: userCreateError instanceof Error ? userCreateError.message : 'Unknown error'
        }, { status: 404 });
      }
    } else {
      console.log(`[POST] Found user: ${user.username} (${user._id})`);
    }

    const newPost = await Post.create({
      author: user._id,
      content: sanitized,
      upvotes: [],
      downvotes: [],
      comments: [],
      mediaUrls: mediaUrls || [],
      community: communityId,
    });

    if (communityId) {
      const com = await Community.findById(communityId);
      if (!com) {
        return NextResponse.json(
            { error: "Community not found" },
            { status: 404 }
        );
      }
      if (!com.members.some((m: Types.ObjectId) => m.equals(user._id))) {
        return NextResponse.json(
            { error: "Must join community first" },
            { status: 403 }
        );
      }
      await com.updateOne({ $push: { posts: newPost._id } });
    }

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
    return NextResponse.json({
      error: "Failed to create post",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
