import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Comment from "@/models/Comment";
import mongoose from "mongoose";
import { z } from "zod";
import { sanitizeInput } from "@/lib/security";
import { rateLimit } from "@/middleware/rateLimit";

// Define validation schema for vote
const voteSchema = z.object({
  voteType: z.enum(["upvote", "downvote"]),
});

// POST /api/comments/[commentId]/vote - Vote on a comment
export async function POST(
  req: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit.check(req, 20, "1m");
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

    // Sanitize and validate commentId
    if (!params?.commentId) {
      return NextResponse.json({ error: "Missing commentId parameter" }, { status: 400 });
    }

    const sanitizedCommentId = sanitizeInput(params.commentId);

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

    // Parse and validate request body
    const body = await req.json();
    const validationResult = voteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { voteType } = validationResult.data;

    // Check if user has already voted
    const hasUpvoted = comment.upvotes.includes(user._id);
    const hasDownvoted = comment.downvotes.includes(user._id);

    // Handle voting logic
    if (voteType === "upvote") {
      if (hasUpvoted) {
        // Remove upvote if already upvoted (toggle off)
        await Comment.findByIdAndUpdate(sanitizedCommentId, {
          $pull: { upvotes: user._id },
        });
      } else {
        // Add upvote and remove downvote if exists
        await Comment.findByIdAndUpdate(sanitizedCommentId, {
          $addToSet: { upvotes: user._id },
          $pull: { downvotes: user._id },
        });

        // Create notification for upvote (only for new upvotes)
        try {
          // Only create notification if the voter is not the comment author
          if (comment.author.toString() !== user._id.toString()) {
            const Notification = mongoose.model('Notification');
            const commentAuthor = await User.findById(comment.author);

            if (commentAuthor) {
              await Notification.create({
                recipient: comment.author,
                sender: user._id,
                type: 'comment_like',
                message: `${user.name} liked your comment`,
                read: false,
                relatedPost: comment.post,
                relatedComment: comment._id
              });
            }
          }
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
          // Continue even if notification creation fails
        }
      }
    } else if (voteType === "downvote") {
      if (hasDownvoted) {
        // Remove downvote if already downvoted (toggle off)
        await Comment.findByIdAndUpdate(sanitizedCommentId, {
          $pull: { downvotes: user._id },
        });
      } else {
        // Add downvote and remove upvote if exists
        await Comment.findByIdAndUpdate(sanitizedCommentId, {
          $addToSet: { downvotes: user._id },
          $pull: { upvotes: user._id },
        });
      }
    }

    // Get updated comment
    const updatedComment = await Comment.findById(sanitizedCommentId);
    if (!updatedComment) {
      return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
    }

    // Check new vote status
    const isUpvoted = updatedComment.upvotes.includes(user._id);
    const isDownvoted = updatedComment.downvotes.includes(user._id);

    return NextResponse.json(
      {
        success: true,
        voteStatus: {
          upvoteCount: updatedComment.upvotes.length,
          downvoteCount: updatedComment.downvotes.length,
          voteCount: updatedComment.upvotes.length - updatedComment.downvotes.length,
          isUpvoted,
          isDownvoted,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/comments/[commentId]/vote] Error:", error);
    return NextResponse.json({ error: "Failed to vote on comment" }, { status: 500 });
  }
}
