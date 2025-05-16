import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import Community from "@/models/Community";
import User from "@/models/User";
import { ApiError } from "@/lib/api-error";
import { sanitizeInput } from "@/lib/security";

// GET /api/communities/slug/[slug] - Get community by slug
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    // Sanitize and validate slug
    if (!params?.slug) {
      return ApiError.badRequest("Missing slug parameter");
    }
    
    const sanitizedSlug = sanitizeInput(params.slug);
    
    await connectToDatabase();

    // Find the community by slug
    const community = await Community.findOne({ slug: sanitizedSlug })
      .populate("creator", "username name image")
      .lean()
      .exec();

    if (!community) {
      return ApiError.notFound("Community not found");
    }

    // Check if the current user is a member, moderator, or creator
    let isMember = false;
    let isModerator = false;
    let isCreator = false;

    if (clerkUserId) {
      const currentUser = await User.findOne({ clerkId: clerkUserId }).lean().exec();
      
      if (currentUser) {
        const currentUserId = currentUser._id.toString();
        
        isMember = community.members.some(
          (id: any) => id.toString() === currentUserId
        );
        
        isModerator = community.moderators.some(
          (id: any) => id.toString() === currentUserId
        );
        
        isCreator = community.creator._id.toString() === currentUserId;
      }
    }

    // Format the response
    const formattedCommunity = {
      id: community._id.toString(),
      name: community.name,
      slug: community.slug,
      description: community.description,
      image: community.image,
      banner: community.banner,
      isPrivate: community.isPrivate || false,
      requiresApproval: community.requiresApproval || false,
      creator: {
        id: community.creator._id.toString(),
        username: community.creator.username,
        name: community.creator.name,
        image: community.creator.image,
      },
      memberCount: community.members?.length || 0,
      postCount: community.posts?.length || 0,
      channelCount: community.channels?.length || 0,
      isMember,
      isModerator,
      isCreator,
      createdAt: community.createdAt.toISOString(),
      updatedAt: community.updatedAt.toISOString(),
    };

    return NextResponse.json({ community: formattedCommunity }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/communities/slug/[slug]] Error:", err);
    return ApiError.internalServerError("Failed to fetch community");
  }
}
