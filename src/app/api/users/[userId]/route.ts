// src/app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import type { Types } from "mongoose";

type RawCommunityRef = {
  _id: Types.ObjectId;
  name: string;
  image?: string;
};

type RawUser = {
  _id: Types.ObjectId;
  username: string;
  name: string;
  image?: string;
  following: Types.ObjectId[];
  followers: Types.ObjectId[];
  communities: RawCommunityRef[];
  createdAt: Date;
  updatedAt: Date;
};

type RawPost = {
  _id: Types.ObjectId;
  content: string;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  comments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  community?: RawCommunityRef;
};

export async function GET(
    _req: NextRequest,
    { params }: { params: { userId: string } }
) {
  try {
    // 1) Who’s calling?
    const { userId: clerkUserId } = await auth();

    // 2) DB
    await connectToDatabase();

    // 3) Load the requested user
    const userDoc = (await User.findById(params.userId)
        .populate("communities", "name image")
        .lean()) as unknown as RawUser | null;

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4) Load their 5 most recent posts
    const postsDocs = (await Post.find({ author: userDoc._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("community", "name image")
        .lean()) as unknown as RawPost[];

    // 5) Check if *you* follow them
    let isFollowing = false;
    if (clerkUserId) {
      const meDoc = (await User.findOne({ clerkId: clerkUserId })
          .lean()) as unknown as RawUser | null;
      if (meDoc) {
        isFollowing = meDoc.following.some((id: Types.ObjectId) =>
            id.equals(userDoc._id)
        );
      }
    }

    // 6) Transform the user object
    const {
      _id,
      username,
      name,
      image,
      following,
      followers,
      communities,
      createdAt,
      updatedAt,
    } = userDoc;

    const user = {
      id: _id.toString(),
      username,
      name,
      image,
      followingCount: following.length,
      followerCount: followers.length,
      communityCount: communities.length,
      isFollowing,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };

    // 7) Transform recentPosts
    const recentPosts = postsDocs.map((p: RawPost) => {
      const {
        _id: postId,
        content,
        upvotes,
        downvotes,
        comments,
        createdAt: cAt,
        updatedAt: uAt,
        community,
      } = p;

      return {
        id: postId.toString(),
        content,
        community: community
            ? {
              id: community._id.toString(),
              name: community.name,
              image: community.image,
            }
            : undefined,
        upvoteCount: upvotes.length,
        downvoteCount: downvotes.length,
        voteCount: upvotes.length - downvotes.length,
        commentCount: comments.length,
        createdAt: cAt.toISOString(),
        updatedAt: uAt.toISOString(),
      };
    });

    // 8) All done
    return NextResponse.json({ user, recentPosts }, { status: 200 });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
    );
  }
}
