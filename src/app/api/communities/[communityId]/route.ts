// src/app/api/communities/[communityId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import Community from "@/models/Community";
import User from "@/models/User";
import type { Types } from "mongoose";

// Define a safe Creator type
interface CreatorData {
    _id: Types.ObjectId;
    username: string;
    name: string;
    image?: string;
}

// GET Community by ID
export async function GET(req: NextRequest, { params }: { params: { communityId: string } }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const { communityId } = params;
        if (!communityId || typeof communityId !== "string") {
            return NextResponse.json({ error: "Invalid community ID" }, { status: 400 });
        }

        const community = await Community.findById(communityId)
            .populate("creator", "username name image")
            .populate("members", "_id")
            .populate("posts", "_id")
            .lean();

        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        const creatorData = community.creator as unknown as CreatorData;

        const formattedCommunity = {
            id: community._id.toString(),
            name: community.name,
            description: community.description,
            image: community.image || "",
            creator: community.creator ? {
                _id: creatorData._id.toString(),
                username: creatorData.username,
                name: creatorData.name,
                image: creatorData.image || "",
            } : null,
            memberCount: (community.members as Types.ObjectId[]).length,
            postCount: (community.posts as Types.ObjectId[]).length,
            createdAt: community.createdAt.toISOString(),
            updatedAt: community.updatedAt.toISOString(),
        };

        return NextResponse.json({ community: formattedCommunity }, { status: 200 });
    } catch (err) {
        console.error("Error fetching community:", err);
        return NextResponse.json({ error: "Failed to fetch community" }, { status: 500 });
    }
}
