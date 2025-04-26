// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Community from "@/models/Community";
import { Types } from "mongoose";

type RawPost = {
  _id: Types.ObjectId;
  author:
      | Types.ObjectId
      | {
    _id: Types.ObjectId;
    username: string;
    name: string;
    image?: string;
  };
  community?:
      | Types.ObjectId
      | {
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
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    await dbConnect();

    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);
    const communityIdParam = url.searchParams.get("communityId") ?? undefined;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (communityIdParam) {
      filter.community = new Types.ObjectId(communityIdParam);
    } else if (userId) {
      const me = await User.findOne({ clerkId: userId }).select("_id");
      if (me) {
        const joined = await Community.find({ members: me._id }).select("_id");
        const joinedIds = joined.map((c: { _id: Types.ObjectId }) => c._id);
        filter.community = { $in: joinedIds };
      }
    }

    const rawPosts = await Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username name image")
        .populate("community", "name image")
        .lean<RawPost[]>();

    const total = await Post.countDocuments(filter);

    let meId: Types.ObjectId | null = null;
    if (userId) {
      const me = await User.findOne({ clerkId: userId }).select("_id");
      if (me) meId = me._id;
    }

    const posts = rawPosts.map((p) => {
      // Author
      let authorInfo: {
        id: string;
        username: string;
        name: string;
        image?: string;
      };
      if (
          typeof p.author === "object" &&
          "_id" in p.author &&
          "username" in p.author
      ) {
        const a = p.author as {
          _id: Types.ObjectId;
          username: string;
          name: string;
          image?: string;
        };
        authorInfo = {
          id: a._id.toString(),
          username: a.username,
          name: a.name,
          image: a.image,
        };
      } else {
        authorInfo = { id: "", username: "", name: "" };
      }

      // Community
      let communityInfo:
          | {
        id: string;
        name: string;
        image?: string;
      }
          | undefined;
      if (
          p.community &&
          typeof p.community === "object" &&
          "_id" in p.community &&
          "name" in p.community
      ) {
        const c = p.community as {
          _id: Types.ObjectId;
          name: string;
          image?: string;
        };
        communityInfo = {
          id: c._id.toString(),
          name: c.name,
          image: c.image,
        };
      } else {
        communityInfo = undefined;
      }

      const upvotes = p.upvotes ?? [];
      const downvotes = p.downvotes ?? [];
      const comments = p.comments ?? [];

      const isUpvoted = meId ? upvotes.some((u) => u.equals(meId)) : false;
      const isDownvoted = meId ? downvotes.some((d) => d.equals(meId)) : false;

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
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();

    const { content, communityId } = (await req.json()) as {
      content: string;
      communityId?: string;
    };

    if (!content.trim()) {
      return NextResponse.json(
          { error: "Post content is required" },
          { status: 400 }
      );
    }
    if (content.length > 50000) {
      return NextResponse.json(
          { error: "Post too long; max 50000 chars" },
          { status: 400 }
      );
    }

    const sanitized = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/g, "")
        .replace(/javascript:[^\s"']+/g, "");

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newPost = await Post.create({
      author: user._id,
      content: sanitized,
      upvotes: [],
      downvotes: [],
      comments: [],
      community: communityId,
    });

    if (communityId) {
      const com = await Community.findById(communityId);
      if (!com) {
        return NextResponse.json(
            { error: "Community not found" },
            { status: 404 }
        );
      }
      if (!com.members.some((m: Types.ObjectId) => m.equals(user._id))) {
        return NextResponse.json(
            { error: "Must join community first" },
            { status: 403 }
        );
      }
      await com.updateOne({ $push: { posts: newPost._id } });
    }

    await newPost.populate("author", "username name image");
    if (communityId) {
      await newPost.populate("community", "name image");
    }

    return NextResponse.json(
        {
          post: {
            id: newPost._id.toString(),
            author: {
              id: newPost.author._id.toString(),
              username: newPost.author.username,
              name: newPost.author.name,
              image: newPost.author.image,
            },
            content: newPost.content,
            community: newPost.community
                ? {
                  id: newPost.community._id.toString(),
                  name: newPost.community.name,
                  image: newPost.community.image,
                }
                : undefined,
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
