import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import Community from "@/models/Community";
import mongoose from "mongoose";
import { sanitizeInput } from "@/lib/security";

// GET /api/profile/[userId]/activity - Get user activity (posts, comments, and communities)
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    // Sanitize and validate userId
    if (!params?.userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const sanitizedUserId = sanitizeInput(params.userId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedUserId)) {
      return NextResponse.json({ error: "Invalid userId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the user
    const user = await User.findById(sanitizedUserId).lean().exec();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the requesting user has permission to view activity
    const isOwner = clerkUserId && user.clerkId === clerkUserId;
    const canViewActivity = isOwner || user.privacySettings?.showActivity !== false;

    if (!canViewActivity) {
      return NextResponse.json({
        error: "This user's activity is private"
      }, { status: 403 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const type = url.searchParams.get("type") || "all"; // "all", "posts", "comments", "communities"

    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // Prepare response object
    const response: {
      posts?: any[];
      comments?: any[];
      communities?: any[];
      pagination: {
        page: number;
        limit: number;
        totalItems: number;
        hasMore: boolean;
      };
    } = {
      pagination: {
        page: validPage,
        limit: validLimit,
        totalItems: 0,
        hasMore: false,
      },
    };

    // Get the current user for determining upvote/downvote status
    let currentUser = null;
    if (clerkUserId) {
      currentUser = await User.findOne({ clerkId: clerkUserId }).lean().exec();
    }

    // Fetch posts if requested
    if (type === "all" || type === "posts") {
      const postsQuery = Post.find({ author: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .populate("author", "username name image")
        .populate("community", "name image")
        .lean()
        .exec();

      const postsCountQuery = Post.countDocuments({ author: user._id }).exec();

      const [posts, postsCount] = await Promise.all([postsQuery, postsCountQuery]);

      response.posts = posts.map(post => ({
        id: post._id.toString(),
        content: post.content,
        author: {
          _id: post.author._id.toString(),
          username: post.author.username,
          name: post.author.name,
          image: post.author.image,
        },
        community: post.community ? {
          _id: post.community._id.toString(),
          name: post.community.name,
          image: post.community.image,
        } : undefined,
        upvoteCount: post.upvotes?.length || 0,
        downvoteCount: post.downvotes?.length || 0,
        voteCount: (post.upvotes?.length || 0) - (post.downvotes?.length || 0),
        commentCount: post.comments?.length || 0,
        isUpvoted: currentUser ? post.upvotes?.some(id => id.toString() === currentUser._id.toString()) || false : false,
        isDownvoted: currentUser ? post.downvotes?.some(id => id.toString() === currentUser._id.toString()) || false : false,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      }));

      response.pagination.totalItems = postsCount;
      response.pagination.hasMore = skip + posts.length < postsCount;
    }

    // Fetch comments if requested
    if (type === "all" || type === "comments") {
      const commentsQuery = Comment.find({ author: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .populate("author", "username name image")
        .populate("post", "content")
        .lean()
        .exec();

      const commentsCountQuery = Comment.countDocuments({ author: user._id }).exec();

      const [comments, commentsCount] = await Promise.all([commentsQuery, commentsCountQuery]);

      response.comments = comments.map(comment => ({
        id: comment._id.toString(),
        content: comment.content,
        author: {
          _id: comment.author._id.toString(),
          username: comment.author.username,
          name: comment.author.name,
          image: comment.author.image,
        },
        post: {
          _id: comment.post._id.toString(),
          content: comment.post.content.substring(0, 100) + (comment.post.content.length > 100 ? '...' : ''),
        },
        upvoteCount: comment.upvotes?.length || 0,
        downvoteCount: comment.downvotes?.length || 0,
        voteCount: (comment.upvotes?.length || 0) - (comment.downvotes?.length || 0),
        isUpvoted: currentUser ? comment.upvotes?.some(id => id.toString() === currentUser._id.toString()) || false : false,
        isDownvoted: currentUser ? comment.downvotes?.some(id => id.toString() === currentUser._id.toString()) || false : false,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      }));

      if (type === "comments") {
        response.pagination.totalItems = commentsCount;
        response.pagination.hasMore = skip + comments.length < commentsCount;
      } else {
        // For "all" type, we need to adjust pagination based on total items
        response.pagination.totalItems += commentsCount;
        // This is a simplification; in a real app, you might want to handle pagination differently for mixed content
      }
    }

    // Fetch communities if requested
    if (type === "all" || type === "communities") {
      const communitiesQuery = Community.find({ members: user._id })
        .sort({ name: 1 })
        .skip(skip)
        .limit(validLimit)
        .lean()
        .exec();

      const communitiesCountQuery = Community.countDocuments({ members: user._id }).exec();

      const [communities, communitiesCount] = await Promise.all([communitiesQuery, communitiesCountQuery]);

      response.communities = communities.map(community => {
        // Find when the user joined this community (if available)
        const membership = community.membershipDates?.find(
          m => m.user.toString() === user._id.toString()
        );

        return {
          id: community._id.toString(),
          name: community.name,
          slug: community.slug,
          description: community.description,
          image: community.image,
          banner: community.banner,
          isPrivate: community.isPrivate,
          memberCount: community.members?.length || 0,
          postCount: community.posts?.length || 0,
          channelCount: community.channels?.length || 0,
          joinedAt: membership?.joinedAt ? membership.joinedAt.toISOString() : null,
          createdAt: community.createdAt.toISOString(),
          updatedAt: community.updatedAt.toISOString(),
        };
      });

      if (type === "communities") {
        response.pagination.totalItems = communitiesCount;
        response.pagination.hasMore = skip + communities.length < communitiesCount;
      } else if (type === "all") {
        // For "all" type, we need to adjust pagination based on total items
        response.pagination.totalItems += communitiesCount;
      }
    }

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[GET /api/profile/[userId]/activity] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user activity" },
      { status: 500 }
    );
  }
}
