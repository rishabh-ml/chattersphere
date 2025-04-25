// src/app/api/communities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import type { Types } from "mongoose";

let isConnected = false;

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
    const { userId } = await auth();

    if (!isConnected) {
      await connectToDatabase();
      isConnected = true;
    }

    const qp = request.nextUrl.searchParams;
    const page = parseInt(qp.get("page") ?? "1", 10);
    const limit = parseInt(qp.get("limit") ?? "10", 10);
    const sortBy = qp.get("sort") ?? "members";
    const skip = (page - 1) * limit;

    // telling TS it's an array
    const raw = await Community.find()
        .populate("creator", "username name image")
        .lean<RawCommunity[]>();

    raw.sort((a, b) => {
      if (sortBy === "recent") return b.createdAt.getTime() - a.createdAt.getTime();
      if (sortBy === "posts")  return b.posts.length - a.posts.length;
      return b.members.length - a.members.length;
    });

    const total = raw.length;
    const slice = raw.slice(skip, skip + limit);

    // optional membership flags
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
          image: c.creator.image,
        };
      } else {
        creatorInfo = { id: (c.creator as Types.ObjectId).toString(), username: "", name: "" };
      }

      return {
        id: c._id.toString(),
        name: c.name,
        description: c.description,
        image: c.image,
        creator: creatorInfo,
        memberCount: c.members.length,
        postCount: c.posts.length,
        isMember: me ? c.members.some((m) => m.equals(me)) : false,
        isModerator: me ? c.moderators.some((m) => m.equals(me)) : false,
        isCreator:
            me &&
            (typeof c.creator === "object"
                ? c.creator._id.equals(me)
                : (c.creator as Types.ObjectId).equals(me)),
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
