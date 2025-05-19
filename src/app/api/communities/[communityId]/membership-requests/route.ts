// src/app/api/communities/[communityId]/membership-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import Membership, { MembershipStatus } from "@/models/Membership";
import mongoose from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { ApiError } from "@/lib/api-error";

// GET /api/communities/[communityId]/membership-requests - Get pending membership requests
export async function GET(
  req: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return ApiError.unauthorized("You must be signed in to view membership requests");
    }

    // Sanitize and validate communityId
    if (!params?.communityId) {
      return ApiError.badRequest("Missing communityId parameter");
    }
    
    const sanitizedCommunityId = sanitizeInput(params.communityId);
    
    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId)) {
      return ApiError.badRequest("Invalid communityId format");
    }

    await connectToDatabase();

    // Get the current user
    const currentUser = await User.findOne({ clerkId: clerkUserId });
    if (!currentUser) {
      return ApiError.notFound("User not found");
    }

    // Find the community
    const community = await Community.findById(sanitizedCommunityId);
    if (!community) {
      return ApiError.notFound("Community not found");
    }

    // Check if the user has permission to view requests (creator or moderator)
    const isCreator = community.creator.toString() === currentUser._id.toString();
    const isModerator = community.moderators.some(
      (modId) => modId.toString() === currentUser._id.toString()
    );

    if (!isCreator && !isModerator) {
      return ApiError.forbidden("You don't have permission to view membership requests");
    }

    // Parse pagination parameters
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
    
    // Validate pagination parameters
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 100 ? limit : 20;
    const skip = (validPage - 1) * validLimit;

    // Find pending membership requests
    const requests = await Membership.find({
      community: community._id,
      status: MembershipStatus.PENDING
    })
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(validLimit)
      .populate("user", "username name image")
      .lean();

    // Count total pending requests
    const totalRequests = await Membership.countDocuments({
      community: community._id,
      status: MembershipStatus.PENDING
    });

    // Format the response
    const formattedRequests = requests.map(request => ({
      id: request._id.toString(),
      user: {
        id: request.user._id.toString(),
        username: request.user.username,
        name: request.user.name,
        image: request.user.image || null,
      },
      requestedAt: request.joinedAt.toISOString(),
    }));

    return NextResponse.json({
      requests: formattedRequests,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalRequests,
        hasMore: skip + requests.length < totalRequests,
      },
    });
  } catch (error) {
    console.error("[MEMBERSHIP-REQUESTS.GET] Error:", error);
    return ApiError.serverError("Failed to fetch membership requests");
  }
}
