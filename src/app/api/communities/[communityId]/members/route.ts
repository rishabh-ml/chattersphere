import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import Community from "@/models/Community";
import User from "@/models/User";
import Membership, { MembershipStatus } from "@/models/Membership";
import { ApiError } from "@/lib/api-error";
import { sanitizeInput } from "@/lib/security";
import mongoose from "mongoose";

// GET /api/communities/[communityId]/members - Get all members of a community
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const resolvedParams = await params;
  try {
    const { userId: clerkUserId } = await auth();
    
    // Sanitize and validate communityId
    if (!resolvedParams?.communityId) {
      return ApiError.badRequest("Missing communityId parameter");
    }
    
    const sanitizedCommunityId = sanitizeInput(resolvedParams.communityId);
    
    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId)) {
      return ApiError.badRequest("Invalid communityId format");
    }

    await connectToDatabase();    // Find the community
    const community = await Community.findById(sanitizedCommunityId).lean().exec() as any;
    
    if (!community) {
      return ApiError.notFound("Community not found");
    }

    // Check if the community is private and the user is not a member
    if (community.isPrivate) {
      if (!clerkUserId) {
        return ApiError.unauthorized("You must be signed in to view members in a private community");
      }      const currentUser = await User.findOne({ clerkId: clerkUserId }).lean().exec() as any;
      
      if (!currentUser) {
        return ApiError.unauthorized("User not found");
      }

      const currentUserId = currentUser._id.toString();
      const isMember = community.members.some(
        (id: any) => id.toString() === currentUserId
      );
      
      if (!isMember) {
        return ApiError.forbidden("You must be a member to view members in this community");
      }
    }

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "active";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const search = url.searchParams.get("search") || "";
    
    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // Build the query
    const query: any = {
      community: sanitizedCommunityId,
    };

    // Filter by status
    if (status === "active") {
      query.status = MembershipStatus.ACTIVE;
    } else if (status === "pending") {
      query.status = MembershipStatus.PENDING;
    } else if (status === "banned") {
      query.status = MembershipStatus.BANNED;
    } else if (status === "all") {
      // No status filter
    } else {
      return ApiError.badRequest("Invalid status parameter");
    }

    // Find memberships with pagination
    const membershipsQuery = Membership.find(query)
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(validLimit)
      .populate({
        path: "user",
        select: "username name image",
      })
      .populate("roles")
      .lean()
      .exec();

    const countQuery = Membership.countDocuments(query).exec();

    const [memberships, totalCount] = await Promise.all([membershipsQuery, countQuery]);    // Format the response
    const formattedMembers = memberships.map((membership: any) => ({
      id: membership._id.toString(),
      user: {
        id: membership.user._id.toString(),
        username: membership.user.username,
        name: membership.user.name,
        image: membership.user.image,
      },
      roles: membership.roles.map((role: any) => ({
        id: role._id.toString(),
        name: role.name,
        color: role.color,
        position: role.position,
        isDefault: role.isDefault,
      })),
      displayName: membership.displayName,
      status: membership.status,
      joinedAt: membership.joinedAt.toISOString(),
      lastActive: membership.lastActive.toISOString(),
    }));

    return NextResponse.json({
      members: formattedMembers,
      pagination: {
        page: validPage,
        limit: validLimit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / validLimit),
        hasMore: skip + memberships.length < totalCount,
      },
    }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/communities/[communityId]/members] Error:", err);
    return ApiError.internalServerError("Failed to fetch community members");
  }
}
