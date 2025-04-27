// src/app/api/users/[userId]/communities/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import type { Types } from "mongoose";

export async function GET(
    _req: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        await connectToDatabase();

        // 1) Load user
        const user = await User.findById(params.userId).populate("communities").lean();

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 2) Transform communities
        const communities = (user.communities as any[]).map((community) => ({
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
