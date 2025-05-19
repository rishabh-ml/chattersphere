// src/app/api/analytics/profile-view/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import mongoose from "mongoose";
import { z } from "zod";

// Define validation schema for profile view
const profileViewSchema = z.object({
  profileId: z.string().min(1, "Profile ID is required")
});

/**
 * POST /api/analytics/profile-view - Log a profile view for analytics
 */
export async function POST(req: NextRequest) {
  try {
    // Get the current user's Clerk ID
    const { userId: clerkUserId } = await auth();
    
    // Check if the user is authenticated
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse and validate the request body
    const body = await req.json();
    const validationResult = profileViewSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Invalid request data",
        details: validationResult.error.errors
      }, { status: 400 });
    }
    
    const { profileId } = validationResult.data;
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the current user and target user
    const currentUser = await User.findOne({ clerkId: clerkUserId }).select("_id").lean();
    const targetUser = await User.findById(profileId).select("_id").lean();
    
    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Prevent logging views of your own profile
    if (currentUser._id.toString() === targetUser._id.toString()) {
      return NextResponse.json({ 
        success: false,
        message: "Cannot log views of your own profile"
      });
    }
    
    // Check if ProfileView model exists, if not, create it
    let ProfileView;
    try {
      ProfileView = mongoose.model('ProfileView');
    } catch (e) {
      // Define the schema if the model doesn't exist
      const ProfileViewSchema = new mongoose.Schema({
        viewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        profile: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: Date.now }
      }, { timestamps: true });
      
      // Create indexes for efficient querying
      ProfileViewSchema.index({ viewer: 1, profile: 1 });
      ProfileViewSchema.index({ profile: 1, timestamp: -1 });
      
      ProfileView = mongoose.model('ProfileView', ProfileViewSchema);
    }
    
    // Log the profile view
    await ProfileView.create({
      viewer: currentUser._id,
      profile: targetUser._id
    });
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PROFILE VIEW] Error:", err);
    return NextResponse.json({ error: "Failed to log profile view" }, { status: 500 });
  }
}
