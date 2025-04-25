// src/app/api/communities/[communityId]/membership/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import type { Types } from "mongoose";

let isConnected = false;

export async function POST(
    req: NextRequest,
    { params }: { params: { communityId: string } }
) {
  try {
    // 1) Clerk auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Ensure Mongo is connected
    if (!isConnected) {
      await connectToDatabase();
      isConnected = true;
    }

    // 3) Parse action
    const { action } = (await req.json()) as { action?: string };
    if (action !== "join" && action !== "leave") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // 4) Lookup current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const me = currentUser._id as Types.ObjectId;

    // 5) Lookup the community
    const community = await Community.findById(params.communityId);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // 6) Prevent creator from leaving
    const creatorId = community.creator as Types.ObjectId;
    if (action === "leave" && creatorId.equals(me)) {
      return NextResponse.json(
          { error: "Community creator cannot leave" },
          { status: 403 }
      );
    }

    // 7) Check membership status
    const isMember = (community.members as Types.ObjectId[]).some((m) =>
        m.equals(me)
    );
    if (action === "join" && isMember) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }
    if (action === "leave" && !isMember) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 });
    }

    // 8) Perform join/leave
    if (action === "join") {
      await Community.findByIdAndUpdate(params.communityId, {
        $addToSet: { members: me },
      });
      await User.findByIdAndUpdate(me, {
        $addToSet: { communities: community._id },
      });
    } else {
      await Community.findByIdAndUpdate(params.communityId, {
        $pull: { members: me, moderators: me },
      });
      await User.findByIdAndUpdate(me, {
        $pull: { communities: community._id },
      });
    }

    // 9) Fetch updated member count
    const updated = await Community.findById(params.communityId);
    const memberCount = updated
        ? (updated.members as Types.ObjectId[]).length
        : 0;

    // 10) Return success payload
    return NextResponse.json(
        {
          success: true,
          action,
          memberCount,
          isMember: action === "join",
        },
        { status: 200 }
    );
  } catch (err) {
    console.error("[MEMBERSHIP.POST] Error:", err);
    return NextResponse.json(
        { error: "Failed to update membership" },
        { status: 500 }
    );
  }
}
