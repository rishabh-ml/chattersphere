import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Comment from "@/models/Comment";
import Post from "@/models/Post";
import Membership, { MembershipStatus } from "@/models/Membership";
import mongoose from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { invalidateCache } from "@/lib/redis";

// DELETE /api/comments/[commentId] - Delete a comment
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sanitize and validate commentId
    if (!resolvedParams?.commentId) {
      return NextResponse.json({ error: "Missing commentId parameter" }, { status: 400 });
    }

    const sanitizedCommentId = sanitizeInput(resolvedParams.commentId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedCommentId)) {
      return NextResponse.json({ error: "Invalid commentId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the comment
    const comment = await Comment.findById(sanitizedCommentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Find the post to check community membership
    const post = await Post.findById(comment.post).populate('community');
    if (!post) {
      return NextResponse.json({ error: "Associated post not found" }, { status: 404 });
    }

    // Check if user is the author of the comment
    const isAuthor = comment.author.toString() === user._id.toString();
    let isAdminOrModerator = false;

    // Check if the user is an admin or moderator of the community
    if (post.community) {
      const membership = await Membership.findOne({
        user: user._id,
        community: post.community._id,
        status: 'ACTIVE',
        role: { $in: ['ADMIN', 'MODERATOR'] }
      });

      isAdminOrModerator = !!membership;
    }

    // Allow deletion if user is the author or an admin/moderator
    if (!isAuthor && !isAdminOrModerator) {
      return NextResponse.json({ error: "Not authorized to delete this comment" }, { status: 403 });
    }

    // Get the post ID to update its comments array
    const postId = comment.post;

    // Delete the comment
    await Comment.findByIdAndDelete(sanitizedCommentId);

    // Remove the comment from the post's comments array
    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: sanitizedCommentId },
    });

    // Invalidate cache for this post
    await invalidateCache(`post:${postId}`);
    await invalidateCache(`post:${postId}:comments`);

    // If this comment has replies, handle them
    // Option 1: Delete all replies (cascade delete)
    await Comment.deleteMany({ parentComment: sanitizedCommentId });

    // Option 2: Make replies top-level comments (uncomment if preferred)
    // await Comment.updateMany(
    //   { parentComment: sanitizedCommentId },
    //   { $unset: { parentComment: 1 } }
    // );

    return NextResponse.json(
      {
        success: true,
        message: "Comment deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE /api/comments/[commentId]] Error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
