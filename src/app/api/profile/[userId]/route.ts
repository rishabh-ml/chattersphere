import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";
import { ApiError } from "@/lib/api-error";
import { sanitizeInput } from "@/lib/security";
import { profileUpdateSchema } from "@/lib/validations/profile";

// GET /api/profile/[userId] - Get user profile data
export async function GET(
  _req: NextRequest,
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

    // Find the user and populate necessary fields
    const userDoc = await User.findById(sanitizedUserId)
      .select("-email") // Don't expose email by default
      .populate("communities", "name image")
      .lean()
      .exec();

    if (!userDoc) {
      return ApiError.notFound("User not found");
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
      followingCount: userDoc.following?.length || 0,
      followerCount: userDoc.followers?.length || 0,
      communityCount: userDoc.communities?.length || 0,
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
      const currentUser = await User.findOne({ clerkId: clerkUserId }).lean().exec();
      if (currentUser) {
        profile.isFollowing = currentUser.following.some(
          (id: mongoose.Types.ObjectId) => id.toString() === userDoc._id.toString()
        );
      }
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/profile/[userId]] Error:", err);
    return ApiError.internalServerError("Failed to fetch profile");
  }
}

// PUT /api/profile/[userId] - Update user profile
export async function PUT(
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
