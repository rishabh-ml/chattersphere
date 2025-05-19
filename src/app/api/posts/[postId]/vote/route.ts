// src/app/api/posts/[postId]/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import mongoose, { Types } from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { VoteType } from "@/models/Vote";

export async function POST(
    req: NextRequest,
    { params }: { params: { postId: string } }
) {
  try {
    // await auth() because it returns a Promise<Auth>
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // connect to the DB
    await connectToDatabase();

    // parse & validate
    const { voteType } = (await req.json()) as { voteType: string };
    if (voteType !== "upvote" && voteType !== "downvote") {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    // look up the user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // look up the post
    const post = await Post.findById(params.postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Mongoose ObjectId type
    const me = currentUser._id as Types.ObjectId;

    // Get the Vote model
    const Vote = mongoose.model('Vote');

    // Find existing vote
    const existingVote = await Vote.findOne({
      user: me,
      target: post._id,
      targetType: 'Post'
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
        post.upvoteCount = Math.max(0, post.upvoteCount - 1);
      } else {
        if (existingVote) {
          // Change from downvote to upvote
          existingVote.voteType = VoteType.UPVOTE;
          await existingVote.save();
          // Update counts
          post.downvoteCount = Math.max(0, post.downvoteCount - 1);
          post.upvoteCount += 1;
        } else {
          // Create new upvote
          await Vote.create({
            user: me,
            target: post._id,
            targetType: 'Post',
            voteType: VoteType.UPVOTE
          });
          // Increment upvote count
          post.upvoteCount += 1;
        }
        isUpvoted = true;

        // Create notification for upvote
      try {
        const Notification = mongoose.model('Notification');
        const postAuthor = await User.findById(post.author);

        // Only create notification if the voter is not the post author
        if (postAuthor && postAuthor._id.toString() !== me.toString()) {
          await Notification.create({
            recipient: post.author,
            sender: me,
            type: 'post_like',
            message: `${currentUser.name} liked your post`,
            read: false,
            relatedPost: post._id
          });
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
        post.downvoteCount = Math.max(0, post.downvoteCount - 1);
      } else {
        if (existingVote) {
          // Change from upvote to downvote
          existingVote.voteType = VoteType.DOWNVOTE;
          await existingVote.save();
          // Update counts
          post.upvoteCount = Math.max(0, post.upvoteCount - 1);
          post.downvoteCount += 1;
        } else {
          // Create new downvote
          await Vote.create({
            user: me,
            target: post._id,
            targetType: 'Post',
            voteType: VoteType.DOWNVOTE
          });
          // Increment downvote count
          post.downvoteCount += 1;
        }
        isDownvoted = true;
      }
    }

    // Save the updated post
    await post.save();

    // Check current vote status
    if (!isUpvoted && !isDownvoted) {
      const currentVote = await Vote.findOne({
        user: me,
        target: post._id,
        targetType: 'Post'
      });

      if (currentVote) {
        isUpvoted = currentVote.voteType === VoteType.UPVOTE;
        isDownvoted = currentVote.voteType === VoteType.DOWNVOTE;
      }
    }

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
    console.error("Error voting on post:", err);
    return NextResponse.json(
        { error: "Failed to vote on post" },
        { status: 500 }
    );
  }
}
