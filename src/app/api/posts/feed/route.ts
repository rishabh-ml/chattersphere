// src/app/api/posts/feed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import type { Types } from "mongoose";

type RawPost = {
  _id: Types.ObjectId;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  comments: unknown[];
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
};

export async function GET(req: NextRequest) {
  try {
    // server-side auth returns a Promise
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const qp = req.nextUrl.searchParams;
    const page = parseInt(qp.get("page") ?? "1", 10);
    const limit = parseInt(qp.get("limit") ?? "10", 10);
    const skip = (page - 1) * limit;

    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // fetch raw posts and cast via unknown to satisfy TS
    const postsRaw = (await Post.find({
      author: { $in: currentUser.following },
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username name image")
        .populate("community", "name image")
        .lean()) as unknown as RawPost[];

    const totalPosts = await Post.countDocuments({
      author: { $in: currentUser.following },
    });
    const hasMore = totalPosts > skip + postsRaw.length;

    const me = currentUser._id as Types.ObjectId;
    const transformed = postsRaw.map((post) => {
      const {
        _id,
        upvotes,
        downvotes,
        comments,
        createdAt,
        updatedAt,
        ...rest
      } = post;

      return {
        id: _id.toString(),
        ...rest,
        upvoteCount: upvotes.length,
        downvoteCount: downvotes.length,
        voteCount: upvotes.length - downvotes.length,
        commentCount: comments.length,
        isUpvoted: upvotes.some((id: Types.ObjectId) => id.equals(me)),
        isDownvoted: downvotes.some((id: Types.ObjectId) => id.equals(me)),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      };
    });

    return NextResponse.json(
        { posts: transformed, pagination: { page, limit, totalPosts, hasMore } },
        { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching home feed:", err);
    return NextResponse.json(
        { error: "Failed to fetch home feed" },
        { status: 500 }
    );
  }
}
