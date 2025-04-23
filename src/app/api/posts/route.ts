import { NextResponse } from "next/server";
import { type Post } from "@/types";

// Mock data for posts
const mockPosts: Post[] = [
  {
    _id: "1",
    authorName: "Sarah Johnson",
    title: "Getting Started with React 19",
    content: "React 19 brings exciting new features that make development faster and more intuitive. Here's what you need to know to get started with the latest version.",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    community: "WebDev",
    upvotes: 42,
    comments: 15,
    saved: false
  },
  {
    _id: "2",
    authorName: "Alex Chen",
    title: "The Future of AI in Web Development",
    content: "Artificial Intelligence is transforming how we build websites and applications. Let's explore the most promising AI tools for developers in 2024.",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    community: "TechTalk",
    upvotes: 78,
    comments: 23,
    saved: false
  },
  {
    _id: "3",
    authorName: "Maya Patel",
    title: "Remote Work Best Practices",
    content: "After 3 years of working remotely, I've learned some valuable lessons about staying productive and maintaining work-life balance. Here are my top tips.",
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
    community: "RemoteWork",
    upvotes: 103,
    comments: 47,
    saved: false
  },
  {
    _id: "4",
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
