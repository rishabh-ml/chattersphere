import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import Membership, { MembershipStatus } from "@/models/Membership";
import mongoose, { Types } from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { invalidateCache } from "@/lib/redis";

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
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/posts/[postId] - Get a single post by ID
export async function GET(_req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth(); // Sanitize and validate postId
    if (!resolvedParams?.postId) {
      return NextResponse.json({ error: "Missing postId parameter" }, { status: 400 });
    }

    const sanitizedPostId = sanitizeInput(resolvedParams.postId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedPostId)) {
      return NextResponse.json({ error: "Invalid postId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the post and populate author and community
    const post = await Post.findById(sanitizedPostId)
      .populate("author", "username name image")
      .populate("community", "name image")
      .lean<PopulatedPost>();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if the post belongs to a private community
    if (post.community) {
      // Fetch the community to check if it's private
      const Community = mongoose.model("Community");
      const community = await Community.findById(post.community._id);

      if (community && community.isPrivate) {
        // If private, user must be authenticated
        if (!userId) {
          console.log(
            `[POSTS GET] Unauthorized access attempt to post ${sanitizedPostId} in private community: ${post.community._id}`
          );
          return NextResponse.json(
            {
              error: "You must be signed in to view posts in this private community",
            },
            { status: 401 }
          );
        }

        // Get the user's MongoDB ID
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
          console.log(`[POSTS GET] User not found for clerkId: ${userId}`);
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if the user is a member of the community using Membership model
        const membership = await Membership.findOne({
          user: user._id,
          community: post.community._id,
          status: "ACTIVE",
        }); // Fallback to the deprecated array if Membership model check fails
        const isMember =
          membership ||
          community.members.some((memberId: any) => memberId.toString() === user._id.toString());

        if (!isMember) {
          console.log(
            `[POSTS GET] Forbidden access attempt by user ${user._id} to post ${sanitizedPostId} in private community: ${post.community._id}`
          );
          return NextResponse.json(
            {
              error: "You are not authorized to view posts in this private community",
            },
            { status: 403 }
          );
        }

        console.log(
          `[POSTS GET] Authorized access to post ${sanitizedPostId} in private community ${post.community._id} by member ${user._id}`
        );
      }
    }

    // Get current user for vote status and saved status
    let currentUser = null;
    if (userId) {
      currentUser = await User.findOne({ clerkId: userId });
    }

    // Format post for response
    const formattedPost = {
      id: post._id.toString(),
      author: {
        id: post.author._id.toString(),
        username: post.author.username,
        name: post.author.name,
        image: post.author.image,
      },
      content: post.content,
      community: post.community
        ? {
            id: post.community._id.toString(),
            name: post.community.name,
            image: post.community.image,
          }
        : undefined,
      upvoteCount: post.upvotes.length,
      downvoteCount: post.downvotes.length,
      voteCount: post.upvotes.length - post.downvotes.length,
      commentCount: post.comments.length,
      isUpvoted: currentUser
        ? post.upvotes.some((id) => id.toString() === currentUser._id.toString())
        : false,
      isDownvoted: currentUser
        ? post.downvotes.some((id) => id.toString() === currentUser._id.toString())
        : false,
      isSaved: currentUser
        ? currentUser.savedPosts.some((id: any) => id.toString() === post._id.toString())
        : false,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };

    return NextResponse.json({ post: formattedPost }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/posts/[postId]] Error:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const resolvedParams = await params;
  try {
    await connectToDatabase();

    // Get the postId from the params
    const { postId } = resolvedParams;
    const sanitizedPostId = sanitizeInput(postId);

    // Validate postId
    if (!mongoose.Types.ObjectId.isValid(sanitizedPostId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    } // Get the authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to delete a post" },
        { status: 401 }
      );
    }

    // Find the user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the post
    const post = await Post.findById(sanitizedPostId).populate("community");
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if the user is the author of the post or a community admin/moderator
    const isAuthor = post.author.toString() === user._id.toString();
    let isAdminOrModerator = false;

    if (post.community) {
      // Check if the user is an admin or moderator of the community
      const membership = await Membership.findOne({
        user: user._id,
        community: post.community._id,
        status: "ACTIVE",
        role: { $in: ["ADMIN", "MODERATOR"] },
      });

      isAdminOrModerator = !!membership;
    }

    if (!isAuthor && !isAdminOrModerator) {
      return NextResponse.json(
        {
          error: "You are not authorized to delete this post",
        },
        { status: 403 }
      );
    }

    // Delete all comments associated with the post
    await Comment.deleteMany({ post: sanitizedPostId });

    // Delete the post
    await Post.findByIdAndDelete(sanitizedPostId);

    // Invalidate cache for this post and related feeds
    await invalidateCache(`post:${sanitizedPostId}`);
    await invalidateCache("posts:feed");
    if (post.community) {
      await invalidateCache(`community:${post.community._id}:posts`);
    }

    return NextResponse.json(
      {
        message: "Post and associated comments deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE /api/posts/[postId]] Error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
