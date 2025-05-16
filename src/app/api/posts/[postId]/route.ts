import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import mongoose, { Types } from "mongoose";
import { sanitizeInput } from "@/lib/security";

// Type for a populated post document
interface PopulatedPost {
  _id: Types.ObjectId;
  author: {
    _id: Types.ObjectId;
    username: string;
    name: string;
    image?: string;
  };
  community?: {
    _id: Types.ObjectId;
    name: string;
    image?: string;
  };
  content: string;
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  comments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/posts/[postId] - Get a single post by ID
export async function GET(
  _req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { userId } = await auth();
    
    // Sanitize and validate postId
    if (!params?.postId) {
      return NextResponse.json({ error: "Missing postId parameter" }, { status: 400 });
    }
    
    const sanitizedPostId = sanitizeInput(params.postId);
    
    if (!mongoose.Types.ObjectId.isValid(sanitizedPostId)) {
      return NextResponse.json({ error: "Invalid postId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the post and populate author and community
    const post = await Post.findById(sanitizedPostId)
      .populate("author", "username name image")
      .populate("community", "name image")
      .lean<PopulatedPost>();
    
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get current user for vote status and saved status
    let currentUser = null;
    if (userId) {
      currentUser = await User.findOne({ clerkId: userId });
    }

    // Format post for response
    const formattedPost = {
      id: post._id.toString(),
      author: {
        id: post.author._id.toString(),
        username: post.author.username,
        name: post.author.name,
        image: post.author.image,
      },
      content: post.content,
      community: post.community
        ? {
            id: post.community._id.toString(),
            name: post.community.name,
            image: post.community.image,
          }
        : undefined,
      upvoteCount: post.upvotes.length,
      downvoteCount: post.downvotes.length,
      voteCount: post.upvotes.length - post.downvotes.length,
      commentCount: post.comments.length,
      isUpvoted: currentUser
        ? post.upvotes.some(id => id.toString() === currentUser._id.toString())
        : false,
      isDownvoted: currentUser
        ? post.downvotes.some(id => id.toString() === currentUser._id.toString())
        : false,
      isSaved: currentUser
        ? currentUser.savedPosts.some(id => id.toString() === post._id.toString())
        : false,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };

    return NextResponse.json({ post: formattedPost }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/posts/[postId]] Error:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}
