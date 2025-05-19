// src/app/api/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import Membership from "@/models/Membership";
import mongoose from "mongoose";
import { invalidateCache } from "@/lib/redis";
import { sanitizeInput } from "@/lib/security";

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

// Define MongoDB document type after lean()
interface UserDocument {
  _id: mongoose.Types.ObjectId;
  clerkId: string;
  username: string;
  name: string;
  email: string;
  bio?: string;
  image?: string;
  following: mongoose.Types.ObjectId[];
  followers: mongoose.Types.ObjectId[];
  communities: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
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
        .exec() as UserDocument | null;

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user: PublicUserResponse = {
      id: userDoc._id.toString(),
      username: userDoc.username,
      name: userDoc.name,
      image: userDoc.image ?? "",
      followerCount: userDoc.followers.length,
      followingCount: userDoc.following.length,
      communityCount: userDoc.communities.length,
      joinedDate: userDoc.createdAt.toISOString(),
      isFollowing: false,
    };

    if (clerkUserId) {
      const me = await User.findOne({ clerkId: clerkUserId }).lean().exec() as UserDocument | null;
      if (me) {
        user.isFollowing = me.following.some(
            (id: mongoose.Types.ObjectId) => id.toString() === userDoc._id.toString()
        );
      }
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("[USER PROFILE API ERROR]:", err);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get the authenticated user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sanitize and validate userId
    if (!params?.userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const sanitizedUserId = sanitizeInput(params.userId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedUserId)) {
      return NextResponse.json({ error: "Invalid userId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the user to be deleted
    const userToDelete = await User.findById(sanitizedUserId);
    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the authenticated user
    const authUser = await User.findOne({ clerkId: clerkUserId });
    if (!authUser) {
      return NextResponse.json({ error: "Authenticated user not found" }, { status: 404 });
    }

    // Check if the authenticated user is the same as the user to be deleted
    if (authUser._id.toString() !== userToDelete._id.toString()) {
      return NextResponse.json({ error: "You can only delete your own account" }, { status: 403 });
    }

    // Start a transaction to ensure all operations succeed or fail together
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Delete all comments by the user
      await Comment.deleteMany({ author: sanitizedUserId }, { session });

      // 2. Delete all posts by the user
      const userPosts = await Post.find({ author: sanitizedUserId });
      const postIds = userPosts.map(post => post._id);

      // Delete comments on user's posts
      await Comment.deleteMany({ post: { $in: postIds } }, { session });

      // Delete the posts
      await Post.deleteMany({ author: sanitizedUserId }, { session });

      // 3. Remove user from communities (update memberships)
      await Membership.deleteMany({ user: sanitizedUserId }, { session });

      // 4. Remove user from other users' followers/following lists
      await User.updateMany(
        { followers: sanitizedUserId },
        { $pull: { followers: sanitizedUserId } },
        { session }
      );

      await User.updateMany(
        { following: sanitizedUserId },
        { $pull: { following: sanitizedUserId } },
        { session }
      );

      // 5. Delete the user from MongoDB
      await User.findByIdAndDelete(sanitizedUserId, { session });

      // 6. Delete the user from Clerk (if possible)
      try {
        if (userToDelete.clerkId) {
          await clerkClient.users.deleteUser(userToDelete.clerkId);
        }
      } catch (clerkError) {
        console.error("Error deleting user from Clerk:", clerkError);
        // Continue with local deletion even if Clerk deletion fails
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Invalidate caches
      await invalidateCache(`user:${sanitizedUserId}`);
      await invalidateCache('posts:feed');

      return NextResponse.json({
        success: true,
        message: "User account and all associated data deleted successfully"
      }, { status: 200 });
    } catch (transactionError) {
      // If anything fails, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
  } catch (err) {
    console.error("[USER DELETE API ERROR]:", err);
    return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 });
  }
}
