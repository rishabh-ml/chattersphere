import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";
import { privacyUpdateSchema } from "@/lib/validations/profile";

// GET /api/profile/[userId]/privacy - Get user privacy settings
export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
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
        { error: "Unauthorized: You can only view your own privacy settings" },
        { status: 403 }
      );
    }

    // Return the privacy settings
    return NextResponse.json(
      {
        privacySettings: user.privacySettings || {
          showEmail: false,
          showActivity: true,
          allowFollowers: true,
          allowMessages: true,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/profile/[userId]/privacy] Error:", err);
    return NextResponse.json({ error: "Failed to fetch privacy settings" }, { status: 500 });
  }
}

// PUT /api/profile/[userId]/privacy - Update user privacy settings
export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!resolvedParams?.userId || !mongoose.Types.ObjectId.isValid(resolvedParams.userId)) {
      return NextResponse.json({ error: "Invalid or missing userId" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the user
    const user = await User.findById(resolvedParams.userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the requesting user is the profile owner
    if (user.clerkId !== clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized: You can only update your own privacy settings" },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = privacyUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");

      return NextResponse.json(
        { error: "Validation error", details: errorMessage },
        { status: 400 }
      );
    }

    const { privacySettings } = validationResult.data; // Update the user document
    const updatedUser = (await User.findByIdAndUpdate(
      resolvedParams.userId,
      {
        $set: {
          privacySettings,
          lastSeen: new Date(),
        },
      },
      { new: true }
    )
      .select("privacySettings")
      .lean()
      .exec()) as any;

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        privacySettings: updatedUser.privacySettings,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PUT /api/profile/[userId]/privacy] Error:", err);
    return NextResponse.json({ error: "Failed to update privacy settings" }, { status: 500 });
  }
}
