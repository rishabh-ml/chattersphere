import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";
import { supabaseAdmin, uploadFile } from "@/lib/supabase";

// PUT /api/profile/[userId]/avatar - Update user avatar
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!params?.userId || !mongoose.Types.ObjectId.isValid(params.userId)) {
      return NextResponse.json({ error: "Invalid or missing userId" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the user
    const user = await User.findById(params.userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the requesting user is the profile owner
    if (user.clerkId !== clerkUserId) {
      return NextResponse.json({ error: "Unauthorized: You can only update your own profile" }, { status: 403 });
    }

    // Parse the form data
    const formData = await req.formData();
    const avatarFile = formData.get('avatar') as File | null;

    if (!avatarFile) {
      return NextResponse.json({ error: "No avatar file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(avatarFile.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Supported formats: JPEG, PNG, WEBP, GIF" 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (avatarFile.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 5MB" 
      }, { status: 400 });
    }

    // Upload to Supabase
    const fileName = `${user._id.toString()}`;
    const avatarUrl = await uploadFile(avatarFile, 'avatars', fileName);

    if (!avatarUrl) {
      return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
    }

    // Update the user document with the new avatar URL
    const updatedUser = await User.findByIdAndUpdate(
      params.userId,
      {
        $set: {
          image: avatarUrl,
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
        avatarUrl,
        profile: {
          ...updatedUser,
          id: updatedUser._id.toString(),
        }
      }, 
      { status: 200 }
    );
  } catch (err) {
    console.error("[PUT /api/profile/[userId]/avatar] Error:", err);
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    );
  }
}
