import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Community from "@/models/Community";
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
  community: {
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

// GET /api/communities/[communityId]/posts - Get posts for a community
export async function GET(
  req: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const { userId } = await auth();
    
    // Sanitize and validate communityId
    if (!params?.communityId) {
      return NextResponse.json({ error: "Missing communityId parameter" }, { status: 400 });
    }
    
    const sanitizedCommunityId = sanitizeInput(params.communityId);
    
    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId)) {
      return NextResponse.json({ error: "Invalid communityId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Check if community exists
    const community = await Community.findById(sanitizedCommunityId);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Parse query parameters
    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);
    const skip = (page - 1) * limit;

    // Fetch posts for the community
    const posts = await Post.find({ community: sanitizedCommunityId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username name image")
      .populate("community", "name image")
      .lean<PopulatedPost[]>();

    // Count total posts
    const total = await Post.countDocuments({ community: sanitizedCommunityId });

    // Get current user for vote status and saved status
    let currentUser = null;
    if (userId) {
      currentUser = await User.findOne({ clerkId: userId });
    }

    // Format posts for response
    const formattedPosts = posts.map(post => {
      const isUpvoted = currentUser
        ? post.upvotes.some(id => id.toString() === currentUser._id.toString())
        : false;
      const isDownvoted = currentUser
        ? post.downvotes.some(id => id.toString() === currentUser._id.toString())
        : false;
      const isSaved = currentUser
        ? currentUser.savedPosts.some(id => id.toString() === post._id.toString())
        : false;
      
      return {
        id: post._id.toString(),
        author: {
          id: post.author._id.toString(),
          username: post.author.username,
          name: post.author.name,
          image: post.author.image,
        },
        content: post.content,
        community: {
          id: post.community._id.toString(),
          name: post.community.name,
          image: post.community.image,
        },
        upvoteCount: post.upvotes.length,
        downvoteCount: post.downvotes.length,
        voteCount: post.upvotes.length - post.downvotes.length,
        commentCount: post.comments.length,
        isUpvoted,
        isDownvoted,
        isSaved,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(
      {
        posts: formattedPosts,
        pagination: {
          page,
          limit,
          totalPosts: total,
          hasMore: total > skip + posts.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/communities/[communityId]/posts] Error:", error);
    return NextResponse.json({ error: "Failed to fetch community posts" }, { status: 500 });
  }
}
