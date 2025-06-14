// src/app/api/posts/feed/mock-route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateMockPosts } from "../mock-data";

export async function GET(req: NextRequest) {
  try {
    console.log("[MOCK] Received request to fetch posts feed");

    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);

    console.log(`[MOCK] Generating mock posts: page=${page}, limit=${limit}`);

    // Generate mock posts
    const mockPosts = generateMockPosts(limit);

    // Simulate total count
    const totalPosts = 100;

    return NextResponse.json(
      {
        posts: mockPosts,
        pagination: {
          page,
          limit,
          totalPosts,
          hasMore: totalPosts > page * limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[MOCK] Error generating mock posts:", error);
    return NextResponse.json({ error: "Failed to generate mock posts" }, { status: 500 });
  }
}
