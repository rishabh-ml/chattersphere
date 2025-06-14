// src/app/api/communities/[communityId]/membership/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import Membership, { MembershipStatus } from "@/models/Membership";
import Notification from "@/models/Notification";
import mongoose, { Types } from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { ApiError } from "@/lib/api-error";
import { z } from "zod";

// Schema for validating the request body
const updateMembershipSchema = z.object({
  action: z.enum(["approve", "reject"]),
  message: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string; userId: string }> }
) {
  const resolvedParams = await params;
  try {
    // 1) Auth
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return ApiError.unauthorized("You must be signed in to manage membership requests");
    }

    // 2) Sanitize & validate params
    const rawCommunityId = sanitizeInput(resolvedParams.communityId || "");
    const rawUserId = sanitizeInput(resolvedParams.userId || "");
    if (!mongoose.isValidObjectId(rawCommunityId) || !mongoose.isValidObjectId(rawUserId)) {
      return ApiError.badRequest("Invalid parameter format");
    }

    // 3) Validate body
    let body: { action: "approve" | "reject"; message?: string };
    try {
      body = updateMembershipSchema.parse(await req.json());
    } catch (err) {
      if (err instanceof z.ZodError) {
        return ApiError.badRequest(`Invalid request body: ${err.errors[0].message}`);
      }
      return ApiError.badRequest("Invalid request body");
    }
    const { action, message } = body;

    await connectToDatabase();

    // 4) Load current user (moderator/creator)
    const currentUser = await User.findOne({ clerkId: clerkUserId });
    if (!currentUser) {
      return ApiError.notFound("User not found");
    }

    // 5) Load community
    const community = await Community.findById(rawCommunityId);
    if (!community) {
      return ApiError.notFound("Community not found");
    }

    // 6) Permission check
    const isCreator = community.creator.equals(currentUser._id);
    const isModerator = community.moderators.some((modId: Types.ObjectId) =>
      modId.equals(currentUser._id)
    );
    if (!isCreator && !isModerator) {
      return ApiError.forbidden("You don't have permission to do that");
    }

    // 7) Find the pending request
    const membershipRequest = await Membership.findOne({
      user: rawUserId,
      community: rawCommunityId,
      status: MembershipStatus.PENDING,
    });
    if (!membershipRequest) {
      return ApiError.notFound("No pending membership request found");
    }

    // 8) APPROVE
    if (action === "approve") {
      membershipRequest.status = MembershipStatus.ACTIVE;
      await membershipRequest.save();

      await Notification.create({
        recipient: rawUserId,
        sender: currentUser._id,
        type: "community_join",
        message: `Your request to join ${community.name} has been approved`,
        read: false,
        relatedCommunity: community._id,
      });
    }

    // 9) REJECT
    if (action === "reject") {
      // Cast to MembershipStatus so TS is happy
      membershipRequest.status = "REJECTED" as MembershipStatus;
      await membershipRequest.save();

      await Notification.create({
        recipient: rawUserId,
        sender: currentUser._id,
        type: "community_join",
        message: `Your request to join ${community.name} has been declined${
          message ? `: ${message}` : ""
        }`,
        read: false,
        relatedCommunity: community._id,
      });
    }

    // 10) Respond
    return NextResponse.json({
      success: true,
      action,
      user: {
        id: rawUserId,
        username: membershipRequest.user.toString(),
        name: membershipRequest.user.toString(),
      },
      community: {
        id: community._id.toString(),
        name: community.name,
      },
      status: membershipRequest.status,
    });
  } catch (error) {
    console.error("[MEMBERSHIP.PATCH] Error:", error);
    // Return a plain JSON 500 if ApiError.serverError doesn't exist
    return NextResponse.json({ error: "Failed to process membership request" }, { status: 500 });
  }
}
