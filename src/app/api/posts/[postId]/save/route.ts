import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import mongoose from "mongoose";
import { sanitizeInput } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Sanitize and validate postId
    if (!resolvedParams?.postId) {
      return NextResponse.json({ error: "Missing postId parameter" }, { status: 400 });
    }

    const sanitizedPostId = sanitizeInput(resolvedParams.postId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedPostId)) {
      return NextResponse.json({ error: "Invalid postId format" }, { status: 400 });
    }

    // Find the user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    } // Find the post
    const post = await Post.findById(sanitizedPostId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if the post is already saved
    const postObjectId = new mongoose.Types.ObjectId(sanitizedPostId);
    const isSaved = user.savedPosts.some((id: mongoose.Types.ObjectId) => id.equals(postObjectId));

    // Toggle saved status
    if (isSaved) {
      // Remove from saved posts
      user.savedPosts = user.savedPosts.filter(
        (id: mongoose.Types.ObjectId) => !id.equals(postObjectId)
      );
    } else {
      // Add to saved posts
      user.savedPosts.push(postObjectId);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      isSaved: !isSaved,
    });
  } catch (error) {
    console.error("[SAVE POST] Error:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
