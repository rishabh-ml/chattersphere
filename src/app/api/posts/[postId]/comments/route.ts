import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { rateLimit } from "@/middleware/rateLimit";
import { sanitizeInput } from "@/lib/security";

// Define validation schema for comment creation
const commentCreateSchema = z.object({
  content: z.string().trim().min(1, "Comment content is required").max(5000, "Comment too long; max 5000 chars"),
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
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { userId } = await auth();

    // Sanitize and validate postId
    if (!params?.postId) {
      return NextResponse.json({ error: "Missing postId parameter" }, { status: 400 });
    }

    const sanitizedPostId = sanitizeInput(params.postId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedPostId)) {
      return NextResponse.json({ error: "Invalid postId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Check if post exists
    const post = await Post.findById(sanitizedPostId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Parse query parameters
    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
    const parentCommentId = url.searchParams.get("parentCommentId") ?? undefined;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { post: sanitizedPostId };

    // If parentCommentId is provided, fetch replies to that comment
    // If parentCommentId is null, fetch top-level comments
    if (parentCommentId) {
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        return NextResponse.json({ error: "Invalid parentCommentId format" }, { status: 400 });
      }
      query.parentComment = parentCommentId;
    } else {
      query.parentComment = { $exists: false };
    }

    // Fetch comments
    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username name image")
      .lean<PopulatedComment[]>();

    // Count total comments matching the query
    const total = await Comment.countDocuments(query);

    // Get current user for vote status
    let currentUser = null;
    if (userId) {
      currentUser = await User.findOne({ clerkId: userId });
    }

    // Format comments for response
    const formattedComments = comments.map(comment => {
      const isUpvoted = currentUser ? comment.upvotes.some(id =>
        id.toString() === currentUser?._id.toString()) : false;
      const isDownvoted = currentUser ? comment.downvotes.some(id =>
        id.toString() === currentUser?._id.toString()) : false;

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
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit.check(req, 10, "1m");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sanitize and validate postId
    if (!params?.postId) {
      return NextResponse.json({ error: "Missing postId parameter" }, { status: 400 });
    }

    const sanitizedPostId = sanitizeInput(params.postId);

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
      const mongoose = require('mongoose');
      const Notification = mongoose.model('Notification');

      if (parentCommentId) {
        // This is a reply to another comment
        const parentComment = await Comment.findById(parentCommentId).populate("author", "_id");

        if (parentComment && parentComment.author._id.toString() !== user._id.toString()) {
          await Notification.create({
            recipient: parentComment.author._id,
            sender: user._id,
            type: 'reply',
            message: `${user.name} replied to your comment`,
            read: false,
            relatedPost: sanitizedPostId,
            relatedComment: newComment._id
          });
        }
      } else {
        // This is a comment on a post
        const postData = await Post.findById(sanitizedPostId).populate("author", "_id");

        if (postData && postData.author._id.toString() !== user._id.toString()) {
          await Notification.create({
            recipient: postData.author._id,
            sender: user._id,
            type: 'comment',
            message: `${user.name} commented on your post`,
            read: false,
            relatedPost: sanitizedPostId,
            relatedComment: newComment._id
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
