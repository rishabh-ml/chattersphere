// src/app/api/users/[userId]/follow/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId: targetUserId } = params;
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const currentUser = await User.findOne({ clerkId: clerkUserId });
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const alreadyFollowing = currentUser.following.includes(targetUser._id);

    if (alreadyFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
          (id: mongoose.Types.ObjectId) => !id.equals(targetUser._id)
      );
      targetUser.followers = targetUser.followers.filter(
          (id: mongoose.Types.ObjectId) => !id.equals(currentUser._id)
      );
    } else {
      // Follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);

      // Create notification for new follow
      try {
        const Notification = mongoose.model('Notification');
        await Notification.create({
          recipient: targetUser._id,
          sender: currentUser._id,
          type: 'follow',
          message: `${currentUser.name} started following you`,
          read: false
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Continue even if notification creation fails
      }
    }

    await currentUser.save();
    await targetUser.save();

    return NextResponse.json({
      isFollowing: !alreadyFollowing,
      followerCount: targetUser.followers.length,
    });
  } catch (err) {
    console.error("[FOLLOW] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
