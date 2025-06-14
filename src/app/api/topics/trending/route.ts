import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";

export async function GET() {
  try {
    await dbConnect();

    // Aggregate posts to find trending topics
    const trendingTopics = await Post.aggregate([
      // Only consider posts from the last 7 days
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      // Unwind the tags array to work with individual tags
      { $unwind: "$tags" },
      // Group by tag and count posts
      {
        $group: {
          _id: "$tags",
          posts: { $sum: 1 },
        },
      },
      // Sort by post count descending
      { $sort: { posts: -1 } },
      // Limit to top 10 topics
      { $limit: 10 },
      // Project to desired output format
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          topic: "$_id",
          posts: 1,
        },
      },
    ]);

    return NextResponse.json({ topics: trendingTopics });
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return NextResponse.json({ error: "Failed to fetch trending topics" }, { status: 500 });
  }
}
