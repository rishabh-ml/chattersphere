// src/app/api/posts/[postId]/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose, { Types } from "mongoose";
import connectToDatabase from "@/lib/dbConnect";
import { sanitizeInput } from "@/lib/security";
import User from "@/models/User";
import Post from "@/models/Post";
import Vote, { VoteType } from "@/models/Vote";
import Notification from "@/models/Notification";

interface VoteBody {
  voteType: VoteType;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const resolvedParams = await params;
  try {
    // 1) Authenticate
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Validate & sanitize postId
    const rawPostId = sanitizeInput(resolvedParams.postId || "");
    if (!mongoose.isValidObjectId(rawPostId)) {
      return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
    }

    await connectToDatabase();

    // 3) Parse & validate body
    const { voteType } = (await req.json()) as VoteBody;
    if (voteType !== VoteType.UPVOTE && voteType !== VoteType.DOWNVOTE) {
      return NextResponse.json({ error: "Invalid voteType" }, { status: 400 });
    }

    // 4) Load user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const me = currentUser._id as Types.ObjectId;

    // 5) Load post
    const post = await Post.findById(rawPostId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 6) Find existing vote (if any)
    const existingVote = await Vote.findOne({
      user: me,
      target: post._id,
      targetType: "Post",
    });

    // 7) Prepare flags
    let isUpvoted = false;
    let isDownvoted = false;

    // 8) Handle upvote
    if (voteType === VoteType.UPVOTE) {
      if (existingVote?.voteType === VoteType.UPVOTE) {
        // Toggle off
        await existingVote.deleteOne();
        post.upvoteCount = Math.max(0, post.upvoteCount - 1);
      } else {
        if (existingVote) {
          // Switch from downvote to upvote
          existingVote.voteType = VoteType.UPVOTE;
          await existingVote.save();
          post.downvoteCount = Math.max(0, post.downvoteCount - 1);
          post.upvoteCount += 1;
        } else {
          // New upvote
          await Vote.create({
            user: me,
            target: post._id,
            targetType: "Post",
            voteType: VoteType.UPVOTE,
          });
          post.upvoteCount += 1;
        }
        isUpvoted = true;

        // Notify author (if not self)
        if (!post.author.equals(me)) {
          await Notification.create({
            recipient: post.author,
            sender: me,
            type: "post_like",
            message: `${currentUser.name} liked your post`,
            read: false,
            relatedPost: post._id,
          });
        }
      }
    }

    // 9) Handle downvote
    else {
      if (existingVote?.voteType === VoteType.DOWNVOTE) {
        // Toggle off
        await existingVote.deleteOne();
        post.downvoteCount = Math.max(0, post.downvoteCount - 1);
      } else {
        if (existingVote) {
          // Switch from upvote to downvote
          existingVote.voteType = VoteType.DOWNVOTE;
          await existingVote.save();
          post.upvoteCount = Math.max(0, post.upvoteCount - 1);
          post.downvoteCount += 1;
        } else {
          // New downvote
          await Vote.create({
            user: me,
            target: post._id,
            targetType: "Post",
            voteType: VoteType.DOWNVOTE,
          });
          post.downvoteCount += 1;
        }
        isDownvoted = true;
      }
    }

    // 10) Persist post changes
    await post.save();

    // 11) Reconcile final status
    if (!isUpvoted && !isDownvoted) {
      const finalVote = await Vote.findOne({
        user: me,
        target: post._id,
        targetType: "Post",
      });
      isUpvoted = finalVote?.voteType === VoteType.UPVOTE;
      isDownvoted = finalVote?.voteType === VoteType.DOWNVOTE;
    }

    // 12) Return updated counts & flags
    return NextResponse.json(
      {
        upvoteCount: post.upvoteCount,
        downvoteCount: post.downvoteCount,
        voteCount: post.upvoteCount - post.downvoteCount,
        isUpvoted,
        isDownvoted,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST] /api/posts/[postId]/vote Error:", err);
    return NextResponse.json(
      { error: "Failed to vote on post" },
      { status: 500 }
    );
  }
}
