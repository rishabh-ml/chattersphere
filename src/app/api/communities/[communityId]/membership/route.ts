// src/app/api/communities/[communityId]/membership/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import mongoose, { Types } from "mongoose";
import { sanitizeInput } from "@/lib/security";

// POST /api/communities/[communityId]/membership - Toggle community membership
export async function POST(
    req: NextRequest,
    { params }: { params: { communityId: string } }
) {
  try {
    // Clerk auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sanitize and validate communityId
    if (!params?.communityId) {
      return NextResponse.json({ error: "Missing communityId parameter" }, { status: 400 });
    }

    const sanitizedCommunityId = sanitizeInput(params.communityId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId)) {
      return NextResponse.json({ error: "Invalid communityId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Get action from request body if provided, otherwise toggle based on current membership
    let action: string | undefined;
    try {
      const body = await req.json();
      action = body.action;
    } catch (e) {
      // No body or invalid JSON, will determine action based on current membership
    }

    // Lookup current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const me = currentUser._id;

    // Lookup the community
    const community = await Community.findById(sanitizedCommunityId);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check membership status
    const isMember = community.members.some((memberId) =>
      memberId.toString() === me.toString()
    );

    // If action wasn't specified in the request, determine it based on current membership
    if (!action) {
      action = isMember ? "leave" : "join";
    }

    // Validate action
    if (action !== "join" && action !== "leave") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Prevent creator from leaving
    if (action === "leave" && community.creator.toString() === me.toString()) {
      return NextResponse.json(
        { error: "Community creator cannot leave" },
        { status: 403 }
      );
    }

    // Check for invalid state
    if (action === "join" && isMember) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }
    if (action === "leave" && !isMember) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 });
    }

    // Perform join/leave
    if (action === "join") {
      await Community.findByIdAndUpdate(sanitizedCommunityId, {
        $addToSet: { members: me },
      });
      await User.findByIdAndUpdate(me, {
        $addToSet: { communities: community._id },
      });
    } else {
      await Community.findByIdAndUpdate(sanitizedCommunityId, {
        $pull: { members: me, moderators: me },
      });
      await User.findByIdAndUpdate(me, {
        $pull: { communities: community._id },
      });
    }

    // Fetch updated member count
    const updated = await Community.findById(sanitizedCommunityId);
    const memberCount = updated ? updated.members.length : 0;

    // Create notification for join (if applicable)
    if (action === "join") {
      try {
        const Notification = mongoose.model('Notification');
        await Notification.create({
          recipient: community.creator,
          sender: me,
          type: 'community_join',
          message: `${currentUser.name} joined your community ${community.name}`,
          read: false,
          relatedCommunity: community._id
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Continue even if notification creation fails
      }
    }

    // Return success payload
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
