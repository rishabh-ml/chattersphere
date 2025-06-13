import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Comment from "@/models/Comment";
import mongoose from "mongoose";
import { z } from "zod";
import { sanitizeInput } from "@/lib/security";
import { rateLimit, apiRateLimit } from "@/lib/rateLimit";
import { VoteType } from "@/models/Vote";

// Define validation schema for vote
const voteSchema = z.object({
  voteType: z.enum(["upvote", "downvote"]),
});

// POST /api/comments/[commentId]/vote - Vote on a comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const resolvedParams = await params;
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req, apiRateLimit);
    if (rateLimitResult) {
      return rateLimitResult;
    }

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

    // Get the Vote model
    const Vote = mongoose.model('Vote');

    // Find existing vote
    const existingVote = await Vote.findOne({
      user: user._id,
      target: comment._id,
      targetType: 'Comment'
    });

    // Initialize vote status
    let isUpvoted = false;
    let isDownvoted = false;

    // Handle vote logic
    if (voteType === "upvote") {
      if (existingVote && existingVote.voteType === VoteType.UPVOTE) {
        // Remove upvote if already upvoted (toggle off)
        await Vote.deleteOne({ _id: existingVote._id });
        // Decrement upvote count
        comment.upvoteCount = Math.max(0, comment.upvoteCount - 1);
      } else {
        if (existingVote) {
          // Change from downvote to upvote
          existingVote.voteType = VoteType.UPVOTE;
          await existingVote.save();
          // Update counts
          comment.downvoteCount = Math.max(0, comment.downvoteCount - 1);
          comment.upvoteCount += 1;
        } else {
          // Create new upvote
          await Vote.create({
            user: user._id,
            target: comment._id,
            targetType: 'Comment',
            voteType: VoteType.UPVOTE
          });
          // Increment upvote count
          comment.upvoteCount += 1;
        }
        isUpvoted = true;

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
      if (existingVote && existingVote.voteType === VoteType.DOWNVOTE) {
        // Remove downvote if already downvoted (toggle off)
        await Vote.deleteOne({ _id: existingVote._id });
        // Decrement downvote count
        comment.downvoteCount = Math.max(0, comment.downvoteCount - 1);
      } else {
        if (existingVote) {
          // Change from upvote to downvote
          existingVote.voteType = VoteType.DOWNVOTE;
          await existingVote.save();
          // Update counts
          comment.upvoteCount = Math.max(0, comment.upvoteCount - 1);
          comment.downvoteCount += 1;
        } else {
          // Create new downvote
          await Vote.create({
            user: user._id,
            target: comment._id,
            targetType: 'Comment',
            voteType: VoteType.DOWNVOTE
          });
          // Increment downvote count
          comment.downvoteCount += 1;
        }
        isDownvoted = true;
      }
    }

    // Save the updated comment
    await comment.save();

    // Check current vote status
    if (!isUpvoted && !isDownvoted) {
      const currentVote = await Vote.findOne({
        user: user._id,
        target: comment._id,
        targetType: 'Comment'
      });

      if (currentVote) {
        isUpvoted = currentVote.voteType === VoteType.UPVOTE;
        isDownvoted = currentVote.voteType === VoteType.DOWNVOTE;
      }
    }

    return NextResponse.json(
      {
        success: true,
        voteStatus: {
          upvoteCount: comment.upvoteCount,
          downvoteCount: comment.downvoteCount,
          voteCount: comment.upvoteCount - comment.downvoteCount,
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
