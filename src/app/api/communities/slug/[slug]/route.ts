import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import Community from "@/models/Community";
import User from "@/models/User";
import { ApiError } from "@/lib/api-error";
import { sanitizeInput } from "@/lib/security";

// GET /api/communities/slug/[slug] - Get community by slug
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  try {
    console.log(
      `[GET /api/communities/slug/[slug]] Fetching community with slug: ${resolvedParams?.slug}`
    );
    const { userId: clerkUserId } = await auth();

    // Sanitize and validate slug
    if (!resolvedParams?.slug) {
      console.log("[GET /api/communities/slug/[slug]] Missing slug parameter");
      return ApiError.badRequest("Missing slug parameter");
    }

    const sanitizedSlug = sanitizeInput(resolvedParams.slug);
    console.log(`[GET /api/communities/slug/[slug]] Sanitized slug: ${sanitizedSlug}`);

    try {
      await connectToDatabase();
      console.log("[GET /api/communities/slug/[slug]] Connected to database");
    } catch (dbError) {
      console.error("[GET /api/communities/slug/[slug]] Database connection error:", dbError);
      return ApiError.internalServerError("Database connection failed");
    } // Find the community by slug
    let community;
    try {
      community = (await Community.findOne({ slug: sanitizedSlug })
        .populate("creator", "username name image")
        .lean()
        .exec()) as any;

      console.log(
        `[GET /api/communities/slug/[slug]] Community found: ${community ? "Yes" : "No"}`
      );
    } catch (findError) {
      console.error("[GET /api/communities/slug/[slug]] Error finding community:", findError);
      return ApiError.internalServerError("Failed to query community");
    }

    if (!community) {
      console.log(
        `[GET /api/communities/slug/[slug]] Community not found with slug: ${sanitizedSlug}`
      );
      return ApiError.notFound("Community not found");
    }

    // Check if the current user is a member, moderator, or creator
    let isMember = false;
    let isModerator = false;
    let isCreator = false;

    if (clerkUserId) {
      try {
        console.log(
          `[GET /api/communities/slug/[slug]] Looking up user with clerkId: ${clerkUserId}`
        );
        const currentUser = (await User.findOne({ clerkId: clerkUserId }).lean().exec()) as any;

        if (currentUser) {
          console.log(`[GET /api/communities/slug/[slug]] Found user: ${currentUser.username}`);
          const currentUserId = currentUser._id.toString();

          // Check if arrays exist before using .some()
          if (Array.isArray(community.members)) {
            isMember = community.members.some((id: any) => id && id.toString() === currentUserId);
          } else {
            console.warn(
              "[GET /api/communities/slug/[slug]] Community members array is missing or invalid"
            );
          }

          if (Array.isArray(community.moderators)) {
            isModerator = community.moderators.some(
              (id: any) => id && id.toString() === currentUserId
            );
          } else {
            console.warn(
              "[GET /api/communities/slug/[slug]] Community moderators array is missing or invalid"
            );
          }

          isCreator =
            community.creator &&
            community.creator._id &&
            community.creator._id.toString() === currentUserId;
        } else {
          console.log(
            `[GET /api/communities/slug/[slug]] User with clerkId ${clerkUserId} not found`
          );
        }
      } catch (userError) {
        console.error("[GET /api/communities/slug/[slug]] Error finding user:", userError);
        // Continue without user data rather than failing the request
      }
    }

    // Format the response
    try {
      console.log("[GET /api/communities/slug/[slug]] Formatting community response");
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
          id:
            community.creator && community.creator._id
              ? community.creator._id.toString()
              : "unknown",
          username: community.creator ? community.creator.username : "unknown",
          name: community.creator ? community.creator.name : "Unknown User",
          image: community.creator ? community.creator.image : null,
        },
        memberCount: Array.isArray(community.members) ? community.members.length : 0,
        postCount: Array.isArray(community.posts) ? community.posts.length : 0,
        channelCount: Array.isArray(community.channels) ? community.channels.length : 0,
        isMember,
        isModerator,
        isCreator,
        createdAt: community.createdAt
          ? community.createdAt.toISOString()
          : new Date().toISOString(),
        updatedAt: community.updatedAt
          ? community.updatedAt.toISOString()
          : new Date().toISOString(),
      };

      console.log("[GET /api/communities/slug/[slug]] Successfully formatted community data");
      return NextResponse.json({ community: formattedCommunity }, { status: 200 });
    } catch (formatError) {
      console.error(
        "[GET /api/communities/slug/[slug]] Error formatting community data:",
        formatError
      );
      return ApiError.internalServerError("Failed to format community data");
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`[GET /api/communities/slug/[slug]] Error: ${errorMessage}`, err);
    return ApiError.internalServerError("Failed to fetch community");
  }
}
