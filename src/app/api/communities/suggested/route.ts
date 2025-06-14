import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/dbConnect";
import Community from "@/models/Community";
import Membership from "@/models/Membership";

export async function GET() {
  try {
    const { userId } = await auth();
    await dbConnect();

    // Find communities the user is not a member of
    let query = {};

    if (userId) {
      // Get communities the user is already a member of
      const userMemberships = await Membership.find({ userId }).select("communityId");
      const userCommunityIds = userMemberships.map((m) => m.communityId);

      // Exclude communities the user is already a member of
      query = {
        _id: { $nin: userCommunityIds },
        isPrivate: false, // Only suggest public communities
      };
    } else {
      // For non-authenticated users, just show public communities
      query = { isPrivate: false };
    }

    // Find communities with the most members
    const suggestedCommunities = await Community.aggregate([
      { $match: query },
      { $sort: { memberCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          id: { $toString: "$_id" },
          name: 1,
          slug: 1,
          memberCount: 1,
          _id: 0,
        },
      },
    ]);

    // Add formatted member count and random color for each community
    const colors = ["bg-purple-500", "bg-blue-500", "bg-green-500", "bg-amber-500", "bg-pink-500"];
    const formattedCommunities = suggestedCommunities.map((community, index) => {
      // Format member count (e.g., 1200 -> "1.2k")
      let members = community.memberCount.toString();
      if (community.memberCount >= 1000) {
        members = (community.memberCount / 1000).toFixed(1) + "k";
      }

      return {
        ...community,
        members,
        color: colors[index % colors.length],
      };
    });

    return NextResponse.json({ communities: formattedCommunities });
  } catch (error) {
    console.error("Error fetching suggested communities:", error);
    return NextResponse.json({ error: "Failed to fetch suggested communities" }, { status: 500 });
  }
}
