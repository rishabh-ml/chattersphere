// src/app/api/communities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import type { Types } from "mongoose";

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

    const raw = await Community.find()
        .populate("creator", "username name image")
        .lean<RawCommunity[]>();

    raw.sort((a, b) => {
      if (sortBy === "recent") return b.createdAt.getTime() - a.createdAt.getTime();
      if (sortBy === "posts") return b.posts.length - a.posts.length;
      return b.members.length - a.members.length;
    });

    const total = raw.length;
    const slice = raw.slice(skip, skip + limit);

    let me: Types.ObjectId | null = null;
    if (userId) {
      const cu = await User.findOne({ clerkId: userId });
      if (cu) me = cu._id;
    }

    const communities = slice.map((c) => {
      let creatorInfo: { id: string; username: string; name: string; image?: string };
      if (typeof c.creator === "object" && "username" in c.creator) {
        creatorInfo = {
          id: c.creator._id.toString(),
          username: c.creator.username,
          name: c.creator.name,
          image: c.creator.image ?? "",
        };
      } else {
        creatorInfo = {
          id: (c.creator as Types.ObjectId).toString(),
          username: "",
          name: "",
          image: "",
        };
      }

      return {
        id: c._id.toString(),
        name: c.name,
        description: c.description,
        image: c.image ?? "",
        creator: creatorInfo,
        memberCount: c.members.length,
        postCount: c.posts.length,
        isMember: me ? c.members.some((m) => m.equals(me)) : false,
        isModerator: me ? c.moderators.some((m) => m.equals(me)) : false,
        isCreator: me
            ? typeof c.creator === "object"
                ? c.creator._id.equals(me)
                : (c.creator as Types.ObjectId).equals(me)
            : false,
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

    const community = await Community.create({
      name,
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
