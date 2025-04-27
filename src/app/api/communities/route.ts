// src/app/api/communities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import type { Types } from "mongoose";
import { mapCreator, isMemberOf, safeArrayLength } from "@/lib/utils/communityUtils";

interface RawCommunity {
  _id: Types.ObjectId;
  name: string;
  description: string;
  image?: string;
  creator:
      | Types.ObjectId
      | {
    _id: Types.ObjectId;
    username: string;
    name: string;
    image?: string;
  };
  members: Types.ObjectId[];
  moderators: Types.ObjectId[];
  posts: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    // Always connect to database first
    await connectToDatabase();

    const { userId } = await auth();

    const qp = request.nextUrl.searchParams;
    const page = parseInt(qp.get("page") ?? "1", 10);
    const limit = parseInt(qp.get("limit") ?? "10", 10);
    const sortBy = qp.get("sort") ?? "members";
    const skip = (page - 1) * limit;

    // Build sort options for MongoDB query
    let sortOptions = {};
    if (sortBy === "recent") {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === "posts") {
      // We'll need to sort in memory since posts is an array
      sortOptions = {};
    } else {
      // Default sort by members
      sortOptions = {}; // We'll need to sort in memory for member count
    }

    // Get total count first for pagination
    const total = await Community.countDocuments();

    // Use MongoDB's skip and limit for efficient pagination
    const query = Community.find()
      .populate("creator", "username name image")
      .skip(skip)
      .limit(limit);

    // Apply sort if it's by creation date
    if (sortBy === "recent") {
      query.sort(sortOptions);
    }

    // Execute query
    const raw = await query.lean<RawCommunity[]>();

    // For sorts that need in-memory processing (posts count, members count)
    if (sortBy === "posts") {
      raw.sort((a, b) => safeArrayLength(b.posts) - safeArrayLength(a.posts));
    } else if (sortBy === "members") {
      raw.sort((a, b) => safeArrayLength(b.members) - safeArrayLength(a.members));
    }

    // optional membership flags
    let me: Types.ObjectId | null = null;
    if (userId) {
      const cu = await User.findOne({ clerkId: userId });
      if (cu) me = cu._id;
    }

    const communities = raw.map((c) => {
      // Use utility function to map creator
      const creatorInfo = mapCreator(c.creator);

      return {
        id: c._id.toString(),
        name: c.name,
        description: c.description,
        image: c.image,
        creator: creatorInfo,
        memberCount: safeArrayLength(c.members),
        postCount: safeArrayLength(c.posts),
        isMember: isMemberOf(me, c.members),
        isModerator: isMemberOf(me, c.moderators),
        isCreator:
            me &&
            (typeof c.creator === "object" && "_id" in c.creator
                ? c.creator._id.equals(me)
                : (c.creator as Types.ObjectId).equals(me)),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });

    // If no communities found, return empty array with message
    if (communities.length === 0 && page === 1) {
      return NextResponse.json(
        {
          communities: [],
          message: "No communities yet. Be the first to create one!",
          pagination: {
            page,
            limit,
            totalCommunities: 0,
            hasMore: false,
          },
          sort: sortBy,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
        {
          communities,
          pagination: {
            page,
            limit,
            totalCommunities: total,
            hasMore: total > skip + limit,
          },
          sort: sortBy,
        },
        { status: 200 }
    );
  } catch (err) {
    console.error("[COMMUNITIES GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}
