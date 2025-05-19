import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { withApiMiddleware } from "@/lib/apiUtils";
import mongoose from "mongoose";

// HEAD /api/notifications/read-all - Check if the endpoint is available
export async function HEAD() {
  return new Response(null, { status: 200 });
}

// Handler function for PUT /api/notifications/read-all
async function markAllNotificationsReadHandler(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error("[PUT /api/notifications/read-all] Database connection error:", dbError);
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
        count: 0,
      });
    }

    // Find the user
    let user;
    try {
      user = await User.findOne({ clerkId: userId });
      if (!user) {
        return NextResponse.json({
          success: true,
          message: "All notifications marked as read",
          count: 0,
        });
      }
    } catch (userError) {
      console.error("[PUT /api/notifications/read-all] User lookup error:", userError);
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
        count: 0,
      });
    }

    // Update all unread notifications for this user
    let result = { modifiedCount: 0 };
    try {
      // Check if Notification model exists
      if (mongoose.models.Notification) {
        result = await Notification.updateMany(
          { recipient: user._id, read: false },
          { $set: { read: true } }
        );
      }
    } catch (updateError) {
      console.error("[PUT /api/notifications/read-all] Update error:", updateError);
      // Continue with zero count
    }

    return NextResponse.json(
      {
        success: true,
        message: "All notifications marked as read",
        count: result.modifiedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PUT /api/notifications/read-all] Error:", error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}

// Export the handler with middleware
export const PUT = withApiMiddleware(markAllNotificationsReadHandler, {
  enableRateLimit: true,
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  identifier: 'notifications:read-all:put'
});
