import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find the user by Clerk ID
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find communities where the user is a member
    const communities = await Community.find({
      _id: { $in: user.communities }
    })
    .select("name slug description image creator members posts")
    .populate("creator", "username name image")
    .lean();

    // Transform the data for the frontend
    const transformedCommunities = communities.map(community => {
      const { _id, name, slug, description, image, creator, members, posts } = community;

      return {
        id: _id.toString(),
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        image,
        creator: creator ? {
          id: creator._id.toString(),
          username: creator.username,
          name: creator.name,
          image: creator.image
        } : undefined,
        memberCount: members?.length || 0,
        postCount: posts?.length || 0,
        createdAt: _id.getTimestamp().toISOString(),
        updatedAt: _id.getTimestamp().toISOString()
      };
    });

    return NextResponse.json({ communities: transformedCommunities });
  } catch (error) {
    console.error("[MY-COMMUNITIES] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch communities" },
      { status: 500 }
    );
  }
}
