// src/app/api/communities/[communityId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import Community from "@/models/Community";
import User from "@/models/User";
import type { Types } from "mongoose";

let isConnected = false;

export async function GET(
    request: NextRequest,
    { params }: { params: { communityId: string } }
) {
    try {
        // 1) Optional Clerk auth
        const { userId } = await auth();

        // 2) Ensure MongoDB is connected
        if (!isConnected) {
            await connectToDatabase();
            isConnected = true;
        }

        // 3) Lookup the community
        const community = await Community.findById(params.communityId)
            .populate("creator", "username name image")
            .lean();

        if (!community) {
            return NextResponse.json({ error: "Community not found" }, { status: 404 });
        }

        // 4) Determine current user’s ObjectId
        let me: Types.ObjectId | null = null;
        if (userId) {
            const cu = await User.findOne({ clerkId: userId });
            if (cu) me = cu._id;
        }

        // 5) Build flags
        const members = (community.members as Types.ObjectId[]) || [];
        const mods    = (community.moderators as Types.ObjectId[]) || [];
        const creator = community.creator as
            | Types.ObjectId
            | { _id: Types.ObjectId };

        const isMember    = me ? members.some((m) => m.equals(me)) : false;
        const isModerator = me ? mods.some((m) => m.equals(me)) : false;
        const isCreator   =
            me &&
            (typeof creator === "object"
                ? creator._id.equals(me)
                : (creator as Types.ObjectId).equals(me));

        // 6) Marshal creator info
        let creatorInfo: { id: string; username: string; name: string; image?: string };
        if (typeof community.creator === "object" && "username" in community.creator) {
            creatorInfo = {
                id: community.creator._id.toString(),
                username: community.creator.username,
                name: community.creator.name,
                image: community.creator.image,
            };
        } else {
            creatorInfo = { id: (community.creator as Types.ObjectId).toString(), username: "", name: "" };
        }

        // 7) Respond
        return NextResponse.json(
            {
                community: {
                    id:            community._id.toString(),
                    name:          community.name,
                    description:   community.description,
                    image:         community.image,
                    creator:       creatorInfo,
                    memberCount:   members.length,
                    postCount:     (community.posts as Types.ObjectId[]).length,
                    isMember,
                    isModerator,
                    isCreator,
                    createdAt:     community.createdAt.toISOString(),
                    updatedAt:     community.updatedAt.toISOString(),
                },
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("[COMMUNITY.GET]", err);
        return NextResponse.json(
            { error: "Failed to fetch community" },
            { status: 500 }
        );
    }
}
