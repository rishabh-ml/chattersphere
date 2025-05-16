import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import type { Types } from "mongoose";

type RawPost = {
  _id: Types.ObjectId;
  author: {
    _id: Types.ObjectId;
    username: string;
    name: string;
    image?: string;
  };
  content: string;
  community?: {
    _id: Types.ObjectId;
    name: string;
    image?: string;
  };
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  comments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);
    const skip = (page - 1) * limit;

    // Find the user and their saved posts
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Count total saved posts
    const total = user.savedPosts.length;

    // Fetch saved posts with pagination
    const rawPosts = await Post.find({ _id: { $in: user.savedPosts } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username name image")
      .populate("community", "name image")
      .lean<RawPost[]>();

    // Transform posts for the frontend
    const posts = rawPosts.map(p => {
      const authorInfo = {
        id: p.author._id.toString(),
        username: p.author.username,
        name: p.author.name,
        image: p.author.image
      };

      const communityInfo = p.community
        ? {
            id: p.community._id.toString(),
            name: p.community.name,
            image: p.community.image
          }
        : undefined;

      const upvotes = p.upvotes || [];
      const downvotes = p.downvotes || [];
      const comments = p.comments || [];

      const isUpvoted = upvotes.some(id => id.equals(user._id));
      const isDownvoted = downvotes.some(id => id.equals(user._id));

      return {
        id: p._id.toString(),
        author: authorInfo,
        content: p.content,
        community: communityInfo,
        upvoteCount: upvotes.length,
        downvoteCount: downvotes.length,
        voteCount: upvotes.length - downvotes.length,
        commentCount: comments.length,
        isUpvoted,
        isDownvoted,
        isSaved: true, // These are saved posts, so they're all saved
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      };
    });

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        totalPosts: total,
        hasMore: total > skip + posts.length
      }
    });
  } catch (error) {
    console.error("[SAVED POSTS] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved posts" },
      { status: 500 }
    );
  }
}
