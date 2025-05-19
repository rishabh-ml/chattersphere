// src/app/api/communities/[communityId]/membership/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import Membership, { MembershipStatus } from "@/models/Membership";
import mongoose from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { ApiError } from "@/lib/api-error";
import { z } from "zod";

// Validation schema for updating membership status
const updateMembershipSchema = z.object({
  action: z.enum(["approve", "reject"]),
  message: z.string().optional(),
});

// PATCH /api/communities/[communityId]/membership/[userId] - Approve or reject membership request
export async function PATCH(
  req: NextRequest,
  { params }: { params: { communityId: string; userId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return ApiError.unauthorized("You must be signed in to manage membership requests");
    }

    // Sanitize and validate parameters
    if (!params?.communityId || !params?.userId) {
      return ApiError.badRequest("Missing required parameters");
    }
    
    const sanitizedCommunityId = sanitizeInput(params.communityId);
    const sanitizedUserId = sanitizeInput(params.userId);
    
    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId) || 
        !mongoose.Types.ObjectId.isValid(sanitizedUserId)) {
      return ApiError.badRequest("Invalid parameter format");
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
      updateMembershipSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ApiError.badRequest(`Invalid request body: ${error.errors[0].message}`);
      }
      return ApiError.badRequest("Invalid request body");
    }

    const { action, message } = body;

    await connectToDatabase();

    // Get the current user (moderator/admin)
    const currentUser = await User.findOne({ clerkId: clerkUserId });
    if (!currentUser) {
      return ApiError.notFound("User not found");
    }

    // Find the community
    const community = await Community.findById(sanitizedCommunityId);
    if (!community) {
      return ApiError.notFound("Community not found");
    }

    // Check if the current user has permission (creator or moderator)
    const isCreator = community.creator.toString() === currentUser._id.toString();
    const isModerator = community.moderators.some(
      (modId) => modId.toString() === currentUser._id.toString()
    );

    if (!isCreator && !isModerator) {
      return ApiError.forbidden("You don't have permission to manage membership requests");
    }

    // Find the user who requested to join
    const requestingUser = await User.findById(sanitizedUserId);
    if (!requestingUser) {
      return ApiError.notFound("Requesting user not found");
    }

    // Find the membership request
    const membershipRequest = await Membership.findOne({
      user: sanitizedUserId,
      community: sanitizedCommunityId,
      status: MembershipStatus.PENDING
    });

    if (!membershipRequest) {
      return ApiError.notFound("No pending membership request found");
    }

    // Process the action
    if (action === "approve") {
      // Update membership status to ACTIVE
      membershipRequest.status = MembershipStatus.ACTIVE;
      await membershipRequest.save();
      
      // Add user to community members
      await Community.findByIdAndUpdate(sanitizedCommunityId, {
        $addToSet: { members: sanitizedUserId },
      });
      
      // Add community to user's communities
      await User.findByIdAndUpdate(sanitizedUserId, {
        $addToSet: { communities: sanitizedCommunityId },
      });
      
      // Create notification for the approved user
      try {
        const Notification = mongoose.model('Notification');
        await Notification.create({
          recipient: sanitizedUserId,
          sender: currentUser._id,
          type: 'community_join',
          message: `Your request to join ${community.name} has been approved`,
          read: false,
          relatedCommunity: sanitizedCommunityId
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Continue even if notification creation fails
      }
    } else if (action === "reject") {
      // Update membership status to REJECTED
      membershipRequest.status = MembershipStatus.REJECTED;
      await membershipRequest.save();
      
      // Create notification for the rejected user
      try {
        const Notification = mongoose.model('Notification');
        await Notification.create({
          recipient: sanitizedUserId,
          sender: currentUser._id,
          type: 'community_join',
          message: `Your request to join ${community.name} has been declined${message ? `: ${message}` : ''}`,
          read: false,
          relatedCommunity: sanitizedCommunityId
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Continue even if notification creation fails
      }
    }

    return NextResponse.json({
      success: true,
      action,
      user: {
        id: requestingUser._id.toString(),
        username: requestingUser.username,
        name: requestingUser.name,
      },
      community: {
        id: community._id.toString(),
        name: community.name,
      },
      status: action === "approve" ? MembershipStatus.ACTIVE : MembershipStatus.REJECTED
    });
  } catch (error) {
    console.error("[MEMBERSHIP.PATCH] Error:", error);
    return ApiError.serverError("Failed to process membership request");
  }
}
