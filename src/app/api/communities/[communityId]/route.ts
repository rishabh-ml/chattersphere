// src/app/api/communities/[communityId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import Community from "@/models/Community";
import User from "@/models/User";
import Membership, { MembershipStatus } from "@/models/Membership";
import mongoose, { Types } from "mongoose";
import { sanitizeInput } from "@/lib/security";

// Raw community shape after .lean()
interface CommunityDoc {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  image?: string;
  banner?: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  creator: {
    _id: Types.ObjectId;
    username: string;
    name: string;
    image?: string;
  };
  moderators: Types.ObjectId[];
  posts: Types.ObjectId[];
  channels: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const resolvedParams = await params;
  try {
    // 1) Optional auth (public communities still visible)
    const { userId } = await auth().catch(() => ({ userId: null }));

    // 2) Validate & sanitize communityId
    const rawId = sanitizeInput(resolvedParams.communityId || "");
    if (!mongoose.isValidObjectId(rawId)) {
      return NextResponse.json({ error: "Missing or invalid communityId" }, { status: 400 });
    }

    await connectToDatabase();

    // 3) Load community + creator info
    const community = (await Community.findById(rawId)
      .populate("creator", "username name image")
      .lean()) as CommunityDoc | null;
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // 4) Compute membership flags
    let isMember = false;
    let isCreator = false;
    let isModerator = false;

    if (userId) {
      const currentUser = await User.findOne({ clerkId: userId });
      if (currentUser) {
        // Active membership?
        isMember = Boolean(
          await Membership.findOne({
            user: currentUser._id,
            community: community._id,
            status: MembershipStatus.ACTIVE,
          })
        );

        // Creator?
        isCreator = community.creator._id.equals(currentUser._id);

        // Moderator?
        isModerator = community.moderators.some((modId: Types.ObjectId) =>
          modId.equals(currentUser._id)
        );
      }
    }

    // 5) Get real member count from Membership
    const memberCount = await Membership.countDocuments({
      community: community._id,
      status: MembershipStatus.ACTIVE,
    });

    // 6) Build response payload
    const payload = {
      id: community._id.toString(),
      name: community.name,
      slug: community.slug,
      description: community.description,
      image: community.image ?? "",
      banner: community.banner ?? "",
      isPrivate: community.isPrivate,
      requiresApproval: community.requiresApproval,
      creator: {
        id: community.creator._id.toString(),
        username: community.creator.username,
        name: community.creator.name,
        image: community.creator.image ?? "",
      },
      moderatorCount: community.moderators.length,
      postCount: community.posts.length,
      channelCount: community.channels.length,
      memberCount,
      isMember,
      isCreator,
      isModerator,
      createdAt: community.createdAt.toISOString(),
      updatedAt: community.updatedAt.toISOString(),
    };

    return NextResponse.json({ community: payload }, { status: 200 });
  } catch (err) {
    console.error("[COMMUNITY.GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch community" }, { status: 500 });
  }
}
