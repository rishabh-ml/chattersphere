// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Community from "@/models/Community";
import type { Types } from "mongoose";

let isConnected = false;

// shape of a lean Post document
type RawPost = {
  _id: Types.ObjectId;
  author: Types.ObjectId | { _id: Types.ObjectId; username: string; name: string; image?: string };
  community?: Types.ObjectId | { _id: Types.ObjectId; name: string; image?: string };
  content: string;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  comments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isConnected) {
      await dbConnect();
      isConnected = true;
    }

    const { content, communityId } = (await req.json()) as {
      content: string;
      communityId?: string;
    };

    // trim & length validations
    if (!content.trim()) {
      return NextResponse.json({ error: "Post content is required" }, { status: 400 });
    }
    if (content.length > 50000) {
      return NextResponse.json(
          { error: "Post too long; limit is 50,000 characters" },
          { status: 400 }
      );
    }

    // sanitize
    const sanitized = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/g, "")
        .replace(/javascript:[^"' ]+/gi, "");

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // create post
    const newPost = await Post.create({
      author: user._id,
      content: sanitized,
      upvotes: [],
      downvotes: [],
      comments: [],
      community: communityId ?? undefined,
    });

    // if community specified, check membership + push
    if (communityId) {
      const com = await Community.findById(communityId);
      if (!com) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      // must be a member
      if (!com.members.some((m: Types.ObjectId) => m.equals(user._id))) {
        return NextResponse.json(
            { error: "You must join the community first" },
            { status: 403 }
        );
      }
      await Community.findByIdAndUpdate(communityId, { $push: { posts: newPost._id } });
    }

    // populate for output
    await newPost.populate("author", "username name image");
    if (communityId) await newPost.populate("community", "name image");

    return NextResponse.json(
        {
          post: {
            id: newPost._id.toString(),
            author: newPost.author,
            content: newPost.content,
            community: newPost.community,
            upvoteCount: 0,
            downvoteCount: 0,
            voteCount: 0,
            commentCount: 0,
            isUpvoted: false,
            isDownvoted: false,
            createdAt: newPost.createdAt.toISOString(),
            updatedAt: newPost.updatedAt.toISOString(),
          },
        },
        { status: 201 }
    );
  } catch (error) {
    console.error("[POST] Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!isConnected) {
      await dbConnect();
      isConnected = true;
    }

    const qp = req.nextUrl.searchParams;
    const page = parseInt(qp.get("page") ?? "1", 10);
    const limit = parseInt(qp.get("limit") ?? "10", 10);
    const communityId = qp.get("communityId") ?? undefined;
    const skip = (page - 1) * limit;

    // build filter
    const filter: Record<string, unknown> = {};
    if (communityId) {
      filter.community = communityId;
    }

    // fetch and cast
    const raw = (await Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username name image")
        .populate("community", "name image")
        .lean()) as unknown as RawPost[];

    const total = await Post.countDocuments(filter);

    // determine current user for vote flags
    let me: Types.ObjectId | null = null;
    if (userId) {
      const u = await User.findOne({ clerkId: userId });
      if (u) me = u._id as Types.ObjectId;
    }

    // transform each post
    const posts = raw.map((p: RawPost) => {
      const {
        _id,
        author,
        community,
        upvotes,
        downvotes,
        comments,
        content,
        createdAt,
        updatedAt,
      } = p;

      // narrow author
      const authorInfo =
          typeof author === "object" && "username" in author
              ? {
                id: author._id.toString(),
                username: author.username,
                name: author.name,
                image: author.image,
              }
              : { id: (author as Types.ObjectId).toString(), username: "", name: "" };

      // narrow community
      const communityInfo =
          community && typeof community === "object" && "name" in community
              ? {
                id: community._id.toString(),
                name: community.name,
                image: community.image,
              }
              : community
                  ? { id: (community as Types.ObjectId).toString(), name: "", image: undefined }
                  : undefined;

      // vote flags
      const isUpvoted = me ? upvotes.some((id: Types.ObjectId) => id.equals(me)) : false;
      const isDownvoted = me ? downvotes.some((id: Types.ObjectId) => id.equals(me)) : false;

      return {
        id: _id.toString(),
        author: authorInfo,
        content,
        community: communityInfo,
        upvoteCount: upvotes.length,
        downvoteCount: downvotes.length,
        voteCount: upvotes.length - downvotes.length,
        commentCount: comments.length,
        isUpvoted,
        isDownvoted,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      };
    });

    return NextResponse.json(
        {
          posts,
          pagination: {
            page,
            limit,
            totalPosts: total,
            hasMore: total > skip + posts.length,
          },
        },
        { status: 200 }
    );
  } catch (error) {
    console.error("[GET] Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
