// src/app/api/posts/[postId]/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import mongoose, { Types } from "mongoose";
import { sanitizeInput } from "@/lib/security";

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

    // see if we've already voted
    const hasUpvoted = post.upvotes.some((id: Types.ObjectId) => id.equals(me));
    const hasDownvoted = post.downvotes.some((id: Types.ObjectId) =>
        id.equals(me)
    );

    // toggle logic
    if (voteType === "upvote") {
      if (hasUpvoted) {
        post.upvotes = post.upvotes.filter((id: Types.ObjectId) => !id.equals(me));
      } else {
        post.upvotes.push(me);
        post.downvotes = post.downvotes.filter((id: Types.ObjectId) => !id.equals(me));
      }
    } else {
      if (hasDownvoted) {
        post.downvotes = post.downvotes.filter((id: Types.ObjectId) => !id.equals(me));
      } else {
        post.downvotes.push(me);
        post.upvotes = post.upvotes.filter((id: Types.ObjectId) => !id.equals(me));
      }
    }

    await post.save();

    // recalc toggles
    const isUpvoted = post.upvotes.some((id: Types.ObjectId) => id.equals(me));
    const isDownvoted = post.downvotes.some((id: Types.ObjectId) =>
        id.equals(me)
    );

    // Create notification for upvote (only if this is a new upvote, not removing an upvote)
    if (voteType === "upvote" && isUpvoted && !hasUpvoted) {
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

    return NextResponse.json(
        {
          upvoteCount: post.upvotes.length,
          downvoteCount: post.downvotes.length,
          voteCount: post.upvotes.length - post.downvotes.length,
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
