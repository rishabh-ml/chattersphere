// src/app/api/communities/[communityId]/membership/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import Membership, { MembershipStatus } from "@/models/Membership";
import Notification from "@/models/Notification";
import mongoose from "mongoose";
import { sanitizeInput } from "@/lib/security";

interface ActionBody {
  action?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const resolvedParams = await params;
  try {
    // 1) Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Validate communityId
    const rawId = sanitizeInput(resolvedParams.communityId || "");
    if (!mongoose.isValidObjectId(rawId)) {
      return NextResponse.json({ error: "Invalid communityId" }, { status: 400 });
    }

    await connectToDatabase();

    // 3) Lookup current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const me = currentUser._id;

    // 4) Lookup community
    const community = await Community.findById(rawId);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // 5) Parse body safely
    const body: ActionBody = (await req.json().catch(() => ({} as ActionBody)));
    let action = body.action;
    const existing = await Membership.findOne({ user: me, community: community._id });
    const isActive = existing?.status === MembershipStatus.ACTIVE;

    // 6) Determine action if none provided
    if (!action) {
      action = isActive ? "leave" : "join";
    }
    if (action !== "join" && action !== "leave") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (action === "leave" && community.creator.equals(me)) {
      return NextResponse.json({ error: "Creator cannot leave" }, { status: 403 });
    }
    if (action === "join" && isActive) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }
    if (action === "leave" && !isActive) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 });
    }

    // 7) JOIN logic
    if (action === "join") {
      // 7a) Approval-required communities
      if (community.requiresApproval) {
        const membershipExists = !!existing;

        // Already pending?
        if (membershipExists && existing!.status === MembershipStatus.PENDING) {
          return NextResponse.json(
            { error: "Request already pending" },
            { status: 400 }
          );
        }

        // If an old request existed but wasn’t active, reopen it
        if (membershipExists && existing!.status !== MembershipStatus.ACTIVE) {
          existing!.status = MembershipStatus.PENDING;
          existing!.joinedAt = new Date();
          await existing!.save();
        }

        // First-time request
        if (!membershipExists) {
          await Membership.create({
            user: me,
            community: community._id,
            status: MembershipStatus.PENDING,
            joinedAt: new Date(),
          });
        }

        // Notify creator & moderators
        const notify = async (recipient: mongoose.Types.ObjectId) => {
          await Notification.create({
            recipient,
            sender: me,
            type: "community_join",
            message: `${currentUser.name} requested to join ${community.name}`,
            read: false,
            relatedCommunity: community._id,
          });
        };
        await notify(community.creator);
        for (const modId of community.moderators) {
          if (!modId.equals(community.creator)) {
            await notify(modId);
          }
        }

        // Return a 202 with pending status
        const pendingCount = await Membership.countDocuments({
          community: community._id,
          status: MembershipStatus.ACTIVE,
        });
        return NextResponse.json(
          {
            success: true,
            action: "request",
            memberCount: pendingCount,
            status: MembershipStatus.PENDING,
          },
          { status: 202 }
        );
      }

      // 7b) Auto-approve communities
      await Membership.findOneAndUpdate(
        { user: me, community: community._id },
        { status: MembershipStatus.ACTIVE, joinedAt: new Date() },
        { upsert: true }
      );

      // Notify creator of the join
      await Notification.create({
        recipient: community.creator,
        sender: me,
        type: "community_join",
        message: `${currentUser.name} joined ${community.name}`,
        read: false,
        relatedCommunity: community._id,
      });
    }

    // 8) LEAVE logic
    if (action === "leave") {
      await Membership.deleteOne({ user: me, community: community._id });
    }

    // 9) Final member count & response
    const memberCount = await Membership.countDocuments({
      community: community._id,
      status: MembershipStatus.ACTIVE,
    });
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
