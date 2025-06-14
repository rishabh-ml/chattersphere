// src/app/api/communities/[communityId]/membership-requests/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import Membership, { MembershipStatus } from "@/models/Membership";
import mongoose, { Types } from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { ApiError } from "@/lib/api-error";

// Shape of a pending request after .lean()
interface LeanRequest {
  _id: Types.ObjectId;
  user: {
    _id: Types.ObjectId;
    username: string;
    name: string;
    image?: string | null;
  };
  joinedAt: Date;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const resolvedParams = await params;
  try {
    // 1) Auth
    const { userId } = await auth();
    if (!userId) {
      return ApiError.unauthorized("You must be signed in to view membership requests");
    }

    // 2) Validate communityId
    const rawCommunityId = sanitizeInput(resolvedParams.communityId || "");
    if (!mongoose.isValidObjectId(rawCommunityId)) {
      return ApiError.badRequest("Missing or invalid communityId");
    }

    await connectToDatabase();

    // 3) Load current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return ApiError.notFound("User not found");
    }

    // 4) Load community
    const community = await Community.findById(rawCommunityId);
    if (!community) {
      return ApiError.notFound("Community not found");
    }

    // 5) Permission check
    const isCreator = community.creator.equals(currentUser._id);
    const isModerator = community.moderators.some((modId: Types.ObjectId) =>
      modId.equals(currentUser._id)
    );
    if (!isCreator && !isModerator) {
      return ApiError.forbidden("You don't have permission to view membership requests");
    }

    // 6) Pagination
    const url = req.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // 7) Query pending requests (typed as an array)
    const rawRequests = (await Membership.find({
      community: community._id,
      status: MembershipStatus.PENDING,
    })
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username name image")
      .lean()) as unknown as LeanRequest[];

    const total = await Membership.countDocuments({
      community: community._id,
      status: MembershipStatus.PENDING,
    });

    // 8) Format for client
    const formatted = rawRequests.map((reqDoc: LeanRequest) => ({
      id: reqDoc._id.toString(),
      user: {
        id: reqDoc.user._id.toString(),
        username: reqDoc.user.username,
        name: reqDoc.user.name,
        image: reqDoc.user.image ?? null,
      },
      requestedAt: reqDoc.joinedAt.toISOString(),
    }));

    return NextResponse.json({
      requests: formatted,
      pagination: {
        page,
        limit,
        totalRequests: total,
        hasMore: skip + formatted.length < total,
      },
    });
  } catch (err) {
    console.error("[MEMBERSHIP-REQUESTS.GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch membership requests" }, { status: 500 });
  }
}
