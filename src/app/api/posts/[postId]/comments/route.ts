import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import Membership, { MembershipStatus } from "@/models/Membership";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { rateLimit } from "@/middleware/rateLimit";
import { sanitizeInput } from "@/lib/security";
import { withCache, invalidateCache } from "@/lib/redis";
import {
  readOptions,
  getPaginationOptions,
  formatPaginationMetadata,
  buildPaginatedAggregation,
} from "@/lib/mongooseUtils";
import { withApiMiddleware } from "@/lib/apiUtils";

// Define validation schema for comment creation
const commentCreateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content is required")
    .max(5000, "Comment too long; max 5000 chars"),
  parentCommentId: z.string().optional(),
});

// Type for a populated comment
interface PopulatedComment {
  _id: Types.ObjectId;
  author: {
    _id: Types.ObjectId;
    username: string;
    name: string;
    image?: string;
  };
  post: Types.ObjectId;
  content: string;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  parentComment?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/posts/[postId]/comments - Get comments for a post
async function getCommentsHandler(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();

    // Sanitize and validate postId
    if (!resolvedParams?.postId) {
      return NextResponse.json({ error: "Missing postId parameter" }, { status: 400 });
    }

    const sanitizedPostId = sanitizeInput(resolvedParams.postId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedPostId)) {
      return NextResponse.json({ error: "Invalid postId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Check if post exists
    const post = await Post.findById(sanitizedPostId).populate("community");
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if the post belongs to a private community
    if (post.community) {
      // Fetch the community to check if it's private
      const Community = mongoose.model("Community");
      const community = await Community.findById(post.community);

      if (community && community.isPrivate) {
        // If private, user must be authenticated
        if (!userId) {
          console.log(
            `[COMMENTS GET] Unauthorized access attempt to comments for post ${sanitizedPostId} in private community: ${post.community}`
          );
          return NextResponse.json(
            {
              error: "You must be signed in to view comments in this private community",
            },
            { status: 401 }
          );
        }

        // Get the user's MongoDB ID
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
          console.log(`[COMMENTS GET] User not found for clerkId: ${userId}`);
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if the user is a member of the community using Membership model
        const membership = await Membership.findOne({
          user: user._id,
          community: post.community,
          status: "ACTIVE",
        }); // Fallback to the deprecated array if Membership model check fails
        const isMember =
          membership ||
          community.members.some(
            (memberId: mongoose.Types.ObjectId) => memberId.toString() === user._id.toString()
          );

        if (!isMember) {
          console.log(
            `[COMMENTS GET] Forbidden access attempt by user ${user._id} to comments for post ${sanitizedPostId} in private community: ${post.community}`
          );
          return NextResponse.json(
            {
              error: "You are not authorized to view comments in this private community",
            },
            { status: 403 }
          );
        }

        console.log(
          `[COMMENTS GET] Authorized access to comments for post ${sanitizedPostId} in private community ${post.community} by member ${user._id}`
        );
      }
    }

    // Parse query parameters
    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
    const parentCommentId = url.searchParams.get("parentCommentId") ?? undefined;

    // Use pagination utility
    const { skip, limit: validLimit } = getPaginationOptions(page, limit);

    // Create a cache key based on the request parameters
    const cacheKey = `post:${sanitizedPostId}:comments:${parentCommentId || "top"}:page:${page}:limit:${validLimit}${userId ? `:user:${userId}` : ""}`;

    // Use cache wrapper with a TTL of 2 minutes
    const result = await withCache(
      cacheKey,
      async () => {
        // Build match stage for aggregation
        const matchStage: any = { post: new mongoose.Types.ObjectId(sanitizedPostId) };

        // If parentCommentId is provided, fetch replies to that comment
        // If parentCommentId is null, fetch top-level comments
        if (parentCommentId) {
          if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
            throw new Error("Invalid parentCommentId format");
          }
          matchStage.parentComment = new mongoose.Types.ObjectId(parentCommentId);
        } else {
          matchStage.parentComment = { $exists: false };
        }

        // Define lookup stages for populating references
        const lookupStages = [
          // Add computed fields for counts
          {
            $addFields: {
              upvoteCount: { $size: { $ifNull: ["$upvotes", []] } },
              downvoteCount: { $size: { $ifNull: ["$downvotes", []] } },
            },
          },
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
        ]; // Build and execute the aggregation pipeline
        const pipeline = buildPaginatedAggregation(
          matchStage,
          { createdAt: -1 },
          page,
          validLimit,
          lookupStages
        );

        const [aggregateResult] = await Comment.aggregate(pipeline as any);

        const total = aggregateResult.metadata.length > 0 ? aggregateResult.metadata[0].total : 0;
        const comments = aggregateResult.data;

        // Get current user for vote status
        let currentUser = null;
        if (userId) {
          currentUser = await User.findOne({ clerkId: userId }).lean(true);
        }

        return { comments, total, currentUser };
      },
      120 // 2 minutes TTL
    );

    const { comments, total, currentUser } = result; // Format comments for response
    const formattedComments = comments.map((comment: any) => {
      const isUpvoted = currentUser
        ? comment.upvotes.some(
            (id: mongoose.Types.ObjectId) => id.toString() === (currentUser as any)?._id?.toString()
          )
        : false;
      const isDownvoted = currentUser
        ? comment.downvotes.some(
            (id: mongoose.Types.ObjectId) => id.toString() === (currentUser as any)?._id?.toString()
          )
        : false;

      return {
        id: comment._id.toString(),
        author: {
          id: comment.author._id.toString(),
          username: comment.author.username,
          name: comment.author.name,
          image: comment.author.image,
        },
        content: comment.content,
        upvoteCount: comment.upvotes.length,
        downvoteCount: comment.downvotes.length,
        voteCount: comment.upvotes.length - comment.downvotes.length,
        isUpvoted,
        isDownvoted,
        parentComment: comment.parentComment?.toString(),
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(
      {
        comments: formattedComments,
        pagination: {
          page,
          limit,
          totalComments: total,
          hasMore: total > skip + comments.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/posts/[postId]/comments] Error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/posts/[postId]/comments - Create a new comment
async function createCommentHandler(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sanitize and validate postId
    if (!resolvedParams?.postId) {
      return NextResponse.json({ error: "Missing postId parameter" }, { status: 400 });
    }

    const sanitizedPostId = sanitizeInput(resolvedParams.postId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedPostId)) {
      return NextResponse.json({ error: "Invalid postId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Check if post exists
    const post = await Post.findById(sanitizedPostId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Find or create user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = commentCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { content, parentCommentId } = validationResult.data;

    // Sanitize content
    const sanitizedContent = sanitizeInput(content);

    // Check parent comment if provided
    let parentComment = undefined;
    if (parentCommentId) {
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        return NextResponse.json({ error: "Invalid parentCommentId format" }, { status: 400 });
      }

      parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }

      // Ensure parent comment belongs to the same post
      if (parentComment.post.toString() !== sanitizedPostId) {
        return NextResponse.json(
          { error: "Parent comment does not belong to this post" },
          { status: 400 }
        );
      }
    }

    // Create the comment
    const newComment = await Comment.create({
      author: user._id,
      post: sanitizedPostId,
      content: sanitizedContent,
      upvotes: [],
      downvotes: [],
      upvoteCount: 0,
      downvoteCount: 0,
      ...(parentCommentId && { parentComment: parentCommentId }),
    });

    // Update post's comments array
    await Post.findByIdAndUpdate(sanitizedPostId, {
      $push: { comments: newComment._id },
    });

    // Populate author details
    const populatedComment = await Comment.findById(newComment._id)
      .populate("author", "username name image")
      .lean<PopulatedComment>();

    if (!populatedComment) {
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    // Create notification for post author or parent comment author
    try {
      const mongoose = require("mongoose");
      const Notification = mongoose.model("Notification");

      if (parentCommentId) {
        // This is a reply to another comment
        const parentComment = await Comment.findById(parentCommentId).populate("author", "_id");

        if (parentComment && parentComment.author._id.toString() !== user._id.toString()) {
          await Notification.create({
            recipient: parentComment.author._id,
            sender: user._id,
            type: "reply",
            message: `${user.name} replied to your comment`,
            read: false,
            relatedPost: sanitizedPostId,
            relatedComment: newComment._id,
          });
        }
      } else {
        // This is a comment on a post
        const postData = await Post.findById(sanitizedPostId).populate("author", "_id");

        if (postData && postData.author._id.toString() !== user._id.toString()) {
          await Notification.create({
            recipient: postData.author._id,
            sender: user._id,
            type: "comment",
            message: `${user.name} commented on your post`,
            read: false,
            relatedPost: sanitizedPostId,
            relatedComment: newComment._id,
          });
        }
      }
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Continue even if notification creation fails
    }

    return NextResponse.json(
      {
        comment: {
          id: populatedComment._id.toString(),
          author: {
            id: populatedComment.author._id.toString(),
            username: populatedComment.author.username,
            name: populatedComment.author.name,
            image: populatedComment.author.image,
          },
          content: populatedComment.content,
          upvoteCount: 0,
          downvoteCount: 0,
          voteCount: 0,
          isUpvoted: false,
          isDownvoted: false,
          parentComment: populatedComment.parentComment?.toString(),
          createdAt: newComment.createdAt.toISOString(),
          updatedAt: newComment.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/posts/[postId]/comments] Error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

// Export the handler functions with middleware
export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    const postId = req.nextUrl.pathname.split("/")[3];
    return getCommentsHandler(req, { params: Promise.resolve({ postId }) });
  },
  {
    enableRateLimit: true,
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    identifier: "comments:get",
  }
);

export const POST = withApiMiddleware(
  async (req: NextRequest) => {
    const postId = req.nextUrl.pathname.split("/")[3];
    return createCommentHandler(req, { params: Promise.resolve({ postId }) });
  },
  {
    enableRateLimit: true,
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    identifier: "comments:post",
  }
);
