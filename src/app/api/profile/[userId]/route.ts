import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";
import { ApiError } from "@/lib/api-error";
import { sanitizeInput } from "@/lib/security";
import { profileUpdateSchema } from "@/lib/validations/profile";
import { withCache } from "@/lib/redis";
import { readOptions, getPaginationOptions, formatPaginationMetadata } from "@/lib/mongooseUtils";
import { withApiMiddleware } from "@/lib/apiUtils";

// GET /api/profile/[userId] - Get user profile data
async function getUserProfileHandler(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    // Sanitize and validate userId
    if (!params?.userId) {
      return ApiError.badRequest("Missing userId parameter");
    }

    const sanitizedUserId = sanitizeInput(params.userId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedUserId)) {
      return ApiError.badRequest("Invalid userId format");
    }

    await connectToDatabase();

    // Create a cache key based on the user ID and requesting user
    const cacheKey = `profile:${sanitizedUserId}${clerkUserId ? `:${clerkUserId}` : ''}`;

    // Use cache wrapper with a TTL of 5 minutes
    const profile = await withCache(
      cacheKey,
      async () => {
        // Use aggregation pipeline for efficient querying
        const pipeline = [
          { $match: { _id: new mongoose.Types.ObjectId(sanitizedUserId) } },
          // Add computed fields for counts
          { $addFields: {
            followingCount: { $size: { $ifNull: ["$following", []] } },
            followerCount: { $size: { $ifNull: ["$followers", []] } },
            communityCount: { $size: { $ifNull: ["$communities", []] } },
          }},
          // Lookup communities
          { $lookup: {
            from: "communities",
            localField: "communities",
            foreignField: "_id",
            as: "communitiesInfo",
            pipeline: [
              { $project: { name: 1, image: 1 } }
            ]
          }},
          // Project only the fields we need
          { $project: {
            _id: 1,
            clerkId: 1,
            username: 1,
            name: 1,
            email: 1,
            bio: 1,
            image: 1,
            pronouns: 1,
            location: 1,
            website: 1,
            socialLinks: 1,
            interests: 1,
            followingCount: 1,
            followerCount: 1,
            communityCount: 1,
            communitiesInfo: 1,
            privacySettings: 1,
            createdAt: 1,
            updatedAt: 1,
          }}
        ];

        const [userDoc] = await User.aggregate(pipeline);

        if (!userDoc) {
          throw new Error("User not found");
        }

        // Check if the requesting user is the profile owner
        const isOwner = clerkUserId && userDoc.clerkId === clerkUserId;

        // Prepare the response based on ownership and privacy settings
        const profile = {
          id: userDoc._id.toString(),
          username: userDoc.username,
          name: userDoc.name,
          bio: userDoc.bio || "",
          image: userDoc.image || "",
          pronouns: userDoc.pronouns || "",
          location: userDoc.location || "",
          website: userDoc.website || "",
          socialLinks: userDoc.socialLinks || [],
          interests: userDoc.interests || [],
          followingCount: userDoc.followingCount,
          followerCount: userDoc.followerCount,
          communityCount: userDoc.communityCount,
          communities: userDoc.communitiesInfo?.map(c => ({
            id: c._id.toString(),
            name: c.name,
            image: c.image || ""
          })) || [],
          isFollowing: false,
          createdAt: userDoc.createdAt.toISOString(),
          updatedAt: userDoc.updatedAt.toISOString(),
        };

        // Add email only if the user is the owner or if showEmail is true
        if (isOwner || (userDoc.privacySettings?.showEmail)) {
          profile.email = userDoc.email;
        }

        // Check if the current user is following this profile
        if (clerkUserId && !isOwner) {
          const currentUser = await User.findOne({ clerkId: clerkUserId }).select("following").lean(true);
          if (currentUser) {
            profile.isFollowing = currentUser.following.some(
              (id: mongoose.Types.ObjectId) => id.toString() === userDoc._id.toString()
            );
          }
        }

        return profile;
      },
      300 // 5 minutes TTL
    );

    return NextResponse.json({ profile }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/profile/[userId]] Error:", err);
    return ApiError.internalServerError("Failed to fetch profile");
  }
}

// PUT /api/profile/[userId] - Update user profile
async function updateUserProfileHandler(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return ApiError.unauthorized();
    }

    // Sanitize and validate userId
    if (!params?.userId) {
      return ApiError.badRequest("Missing userId parameter");
    }

    const sanitizedUserId = sanitizeInput(params.userId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedUserId)) {
      return ApiError.badRequest("Invalid userId format");
    }

    await connectToDatabase();

    // Find the user
    const user = await User.findById(sanitizedUserId);

    if (!user) {
      return ApiError.notFound("User not found");
    }

    // Check if the requesting user is the profile owner
    if (user.clerkId !== clerkUserId) {
      return ApiError.forbidden("You can only update your own profile");
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');

      return ApiError.badRequest("Validation error", { details: errorMessage });
    }

    const { bio, pronouns, location, website, socialLinks, interests } = validationResult.data;

    // Update the user document
    const updatedUser = await User.findByIdAndUpdate(
      params.userId,
      {
        $set: {
          ...(bio !== undefined && { bio }),
          ...(pronouns !== undefined && { pronouns }),
          ...(location !== undefined && { location }),
          ...(website !== undefined && { website }),
          ...(socialLinks !== undefined && { socialLinks }),
          ...(interests !== undefined && { interests }),
          lastSeen: new Date(),
        },
      },
      { new: true }
    )
      .select("-email")
      .lean()
      .exec();

    return NextResponse.json(
      {
        success: true,
        profile: {
          ...updatedUser,
          id: updatedUser._id.toString(),
        }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PUT /api/profile/[userId]] Error:", err);
    return ApiError.internalServerError("Failed to update profile");
  }
}

// Export the handler functions with middleware
export const GET = withApiMiddleware(
  (req: NextRequest) => getUserProfileHandler(req, { params: { userId: req.nextUrl.pathname.split('/')[3] } }),
  {
    enableRateLimit: true,
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    identifier: 'profile:get'
  }
);

export const PUT = withApiMiddleware(
  (req: NextRequest) => updateUserProfileHandler(req, { params: { userId: req.nextUrl.pathname.split('/')[3] } }),
  {
    enableRateLimit: true,
    maxRequests: 20,
    windowMs: 60000, // 1 minute
    identifier: 'profile:put'
  }
);