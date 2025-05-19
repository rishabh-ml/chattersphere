// src/app/api/communities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import type { Types } from "mongoose";
import { generateUniqueSlug } from "@/lib/utils";

interface RawCommunity {
  _id: Types.ObjectId;
  name: string;
  slug: string;
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

// ---------- GET (for fetching all communities) ----------
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    await connectToDatabase();

    const qp = request.nextUrl.searchParams;
    const page = parseInt(qp.get("page") ?? "1", 10);
    const limit = parseInt(qp.get("limit") ?? "10", 10);
    const sortBy = qp.get("sort") ?? "members";
    const skip = (page - 1) * limit;

    // Build sort configuration for database-level sorting
    let sortConfig = {};
    if (sortBy === "recent") {
      sortConfig = { createdAt: -1 };
    }
    // Note: For posts and members counts, we'll use aggregation pipeline
    // since these are arrays and we need to count their length

    // Use aggregation pipeline for efficient database-level operations
    let aggregationPipeline = [];

    // Match stage (can add filters here in the future)
    aggregationPipeline.push({ $match: {} });

    // Add fields for counts
    aggregationPipeline.push({
      $addFields: {
        memberCount: { $size: "$members" },
        postCount: { $size: "$posts" }
      }
    });

    // Sort based on user preference
    if (sortBy === "recent") {
      aggregationPipeline.push({ $sort: { createdAt: -1 } });
    } else if (sortBy === "posts") {
      aggregationPipeline.push({ $sort: { postCount: -1 } });
    } else {
      // Default sort by members
      aggregationPipeline.push({ $sort: { memberCount: -1 } });
    }

    // Count total before pagination
    const countPipeline = [...aggregationPipeline];
    countPipeline.push({ $count: "total" });
    const totalResult = await Community.aggregate(countPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limit });

    // Lookup creator information
    aggregationPipeline.push({
      $lookup: {
        from: "users",
        localField: "creator",
        foreignField: "_id",
        as: "creatorInfo"
      }
    });

    // Unwind creator info
    aggregationPipeline.push({
      $unwind: {
        path: "$creatorInfo",
        preserveNullAndEmptyArrays: true
      }
    });

    // Execute the aggregation
    const communitiesResult = await Community.aggregate(aggregationPipeline);

    let me: Types.ObjectId | null = null;
    if (userId) {
      const cu = await User.findOne({ clerkId: userId });
      if (cu) me = cu._id;
    }

    const communities = communitiesResult.map((c) => {
      // Format creator info from the aggregation result
      const creatorInfo = c.creatorInfo ? {
        id: c.creatorInfo._id.toString(),
        username: c.creatorInfo.username,
        name: c.creatorInfo.name,
        image: c.creatorInfo.image ?? "",
      } : {
        id: c.creator.toString(),
        username: "",
        name: "",
        image: "",
      }

      return {
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image ?? "",
        creator: creatorInfo,
        memberCount: c.memberCount || 0,
        postCount: c.postCount || 0,
        isMember: me ? c.members.some((m) => m.equals(me)) : false,
        isModerator: me ? c.moderators.some((m) => m.equals(me)) : false,
        isCreator: me ? c.creator.toString() === me.toString() : false,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });

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

// ---------- POST (for creating a new community) ----------
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { name, description, image } = await request.json();

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
    }

    const creator = await User.findOne({ clerkId: userId });
    if (!creator) {
      return NextResponse.json({ error: "Creator user not found" }, { status: 404 });
    }

    // Check for existing community with same name (optional)
    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return NextResponse.json({ error: "Community name already exists" }, { status: 400 });
    }

    // Generate a unique slug for the community
    console.log(`[COMMUNITIES POST] Generating slug for community name: "${name}"`);
    const slug = await generateUniqueSlug(name, Community);
    console.log(`[COMMUNITIES POST] Generated unique slug: "${slug}"`);

    const community = await Community.create({
      name,
      slug,
      description,
      image,
      creator: creator._id,
      members: [creator._id],
      moderators: [creator._id],
      posts: [],
    });

    // Update user document
    creator.communities.push(community._id);
    await creator.save();

    return NextResponse.json(
        {
          message: "Community created successfully",
          community: {
            id: community._id.toString(),
            name: community.name,
            slug: community.slug,
            description: community.description,
            image: community.image ?? "",
            creator: {
              id: creator._id.toString(),
              username: creator.username,
              name: creator.name,
              image: creator.image ?? "",
            },
            memberCount: 1,
            postCount: 0,
            createdAt: community.createdAt.toISOString(),
            updatedAt: community.updatedAt.toISOString(),
          },
        },
        { status: 201 }
    );
  } catch (err) {
    console.error("[COMMUNITIES POST] Error:", err);
    return NextResponse.json({ error: "Failed to create community" }, { status: 500 });
  }
}
