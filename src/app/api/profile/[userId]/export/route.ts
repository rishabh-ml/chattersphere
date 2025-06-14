import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import mongoose from "mongoose";

// POST /api/profile/[userId]/export - Request a data export
export async function POST(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!resolvedParams?.userId || !mongoose.Types.ObjectId.isValid(resolvedParams.userId)) {
      return NextResponse.json({ error: "Invalid or missing userId" }, { status: 400 });
    }

    await connectToDatabase(); // Find the user
    const user = (await User.findById(resolvedParams.userId).lean().exec()) as any;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the requesting user is the profile owner
    if (user.clerkId !== clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized: You can only export your own data" },
        { status: 403 }
      );
    }

    // Generate a unique export ID
    const exportId = new mongoose.Types.ObjectId().toString();

    // In a real application, you would queue this job for background processing
    // For this example, we'll generate the export synchronously

    // Fetch all user data
    const userData = {
      profile: {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        email: user.email,
        bio: user.bio || "",
        image: user.image || "",
        pronouns: user.pronouns || "",
        location: user.location || "",
        website: user.website || "",
        socialLinks: user.socialLinks || [],
        interests: user.interests || [],
        privacySettings: user.privacySettings || {},
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    }; // Fetch user's posts
    const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 }).lean().exec();

    (userData as any).posts = posts.map((post: any) => ({
      id: post._id.toString(),
      content: post.content,
      community: post.community?.toString(),
      upvotes: post.upvotes?.length || 0,
      downvotes: post.downvotes?.length || 0,
      comments: post.comments?.length || 0,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    }));

    // Fetch user's comments
    const comments = await Comment.find({ author: user._id }).sort({ createdAt: -1 }).lean().exec();
    (userData as any).comments = comments.map((comment: any) => ({
      id: comment._id.toString(),
      content: comment.content,
      post: comment.post.toString(),
      parentComment: comment.parentComment?.toString(),
      upvotes: comment.upvotes?.length || 0,
      downvotes: comment.downvotes?.length || 0,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    }));

    // In a real application, you would store this data in a secure location
    // and provide a download link that expires after a certain time

    // For this example, we'll return the data directly
    // In a production app, you would return a token or job ID that the user can use to check the status
    return NextResponse.json(
      {
        success: true,
        message: "Data export generated successfully",
        exportId,
        data: userData,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/profile/[userId]/export] Error:", err);
    return NextResponse.json({ error: "Failed to generate data export" }, { status: 500 });
  }
}
