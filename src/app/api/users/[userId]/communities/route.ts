// src/app/api/users/[userId]/communities/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import type { Types } from "mongoose";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  try {
    await connectToDatabase();

    // Define user document type
    interface UserDocument {
      _id: Types.ObjectId;
      communities: CommunityDocument[];
    } // 1) Load user
    const user = (await User.findById(resolvedParams.userId).populate("communities").lean()) as any;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Define the community type
    interface CommunityDocument {
      _id: Types.ObjectId;
      name: string;
      image?: string;
      members: Types.ObjectId[];
    } // 2) Transform communities
    const communities = user.communities.map((community: any) => ({
      id: community._id.toString(),
      name: community.name,
      image: community.image || "/placeholder.png",
      memberCount: community.members.length,
    }));

    return NextResponse.json({ communities }, { status: 200 });
  } catch (err) {
    console.error("[GET /users/[userId]/communities] Error:", err);
    return NextResponse.json({ error: "Failed to fetch user's communities" }, { status: 500 });
  }
}
