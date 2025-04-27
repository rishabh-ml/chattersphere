// src/app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User, { IUser } from "@/models/User";
import mongoose from "mongoose";

interface PublicUserResponse {
  id: string;
  username: string;
  name: string;
  image?: string;
  followerCount: number;
  followingCount: number;
  communityCount: number;
  joinedDate: string;
  isFollowing: boolean;
}

export async function GET(
    _req: NextRequest,
    { params }: { params: { userId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!params?.userId || !mongoose.Types.ObjectId.isValid(params.userId)) {
      return NextResponse.json({ error: "Invalid or missing userId" }, { status: 400 });
    }

    await connectToDatabase();

    const userDoc = await User.findById(params.userId)
        .populate("communities", "name image")
        .lean()
        .exec();

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = {
      id: userDoc._id.toString(),
      username: userDoc.username,
      name: userDoc.name,
      image: userDoc.image ?? "",
      followerCount: userDoc.followers.length,
      followingCount: userDoc.following.length,
      communityCount: userDoc.communities.length,
      joinedDate: userDoc.createdAt.toISOString(),
      isFollowing: false,
    } satisfies PublicUserResponse;

    if (clerkUserId) {
      const me = await User.findOne({ clerkId: clerkUserId }).lean().exec();
      if (me) {
        user.isFollowing = me.following.some(
            (id) => id.toString() === userDoc._id.toString()
        );
      }
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("[USER PROFILE API ERROR]:", err);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}
