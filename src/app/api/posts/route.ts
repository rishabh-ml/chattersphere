import { NextResponse } from "next/server";
import { type Post } from "@/types";

// Mock data for posts
const mockPosts: Post[] = [
  {
    _id: "1",
    authorName: "Rishabh",
    content: "Hey Guys, we are in the middle of the Development of the ChatterSphere. First of all, I wanna thank you all for creating an account on the platform. Stay tuned for more updates!",
    createdAt: new Date().toISOString(),
    community: "Announcements",
    upvotes: 156,
    comments: 32,
    saved: false
  }
];

export async function GET() {
  try {
    // In a real application, you would fetch posts from a database
    // For now, we'll return mock data
    return NextResponse.json({ posts: mockPosts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
