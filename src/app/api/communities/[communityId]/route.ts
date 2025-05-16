// src/app/api/communities/[communityId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import Community from "@/models/Community";
import User from "@/models/User";
import mongoose, { Types } from "mongoose";
import { sanitizeInput } from "@/lib/security";

// Define types for MongoDB documents after lean()
interface CommunityDocument {
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
    members: Types.ObjectId[];
    moderators: Types.ObjectId[];
    posts: Types.ObjectId[];
    channels: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

// GET Community by ID
export async function GET(req: NextRequest, { params }: { params: { communityId: string } }) {
    try {
        const { userId } = await auth();

        // Sanitize and validate communityId
        if (!params?.communityId) {
            return NextResponse.json({ error: "Missing communityId parameter" }, { status: 400 });
        }

        const sanitizedCommunityId = sanitizeInput(params.communityId);

        if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId)) {
            return NextResponse.json({ error: "Invalid communityId format" }, { status: 400 });
        }

        await connectToDatabase();

        const community = await Community.findById(sanitizedCommunityId)
            .populate("creator", "username name image")
            .lean() as CommunityDocument | null;

        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        // Check if the current user is a member, moderator, or creator
        let isMember = false;
        let isModerator = false;
        let isCreator = false;

        if (userId) {
            const currentUser = await User.findOne({ clerkId: userId });

            if (currentUser) {
                isMember = community.members.some(id => id.toString() === currentUser._id.toString());
                isModerator = community.moderators.some(id => id.toString() === currentUser._id.toString());
                isCreator = community.creator._id.toString() === currentUser._id.toString();
            }
        }

        const formattedCommunity = {
            id: community._id.toString(),
            name: community.name,
            slug: community.slug,
            description: community.description,
            image: community.image || "",
            banner: community.banner || "",
            isPrivate: community.isPrivate,
            requiresApproval: community.requiresApproval,
            creator: community.creator ? {
                id: community.creator._id.toString(),
                username: community.creator.username,
                name: community.creator.name,
                image: community.creator.image || "",
            } : null,
            memberCount: community.members.length,
            postCount: community.posts.length,
            channelCount: community.channels?.length || 0,
            isMember,
            isModerator,
            isCreator,
            createdAt: community.createdAt.toISOString(),
            updatedAt: community.updatedAt.toISOString(),
        };

        return NextResponse.json({ community: formattedCommunity }, { status: 200 });
    } catch (err) {
        console.error("Error fetching community:", err);
        return NextResponse.json({ error: "Failed to fetch community" }, { status: 500 });
    }
}
