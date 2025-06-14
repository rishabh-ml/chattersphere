import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Notification from "@/models/Notification";
import mongoose from "mongoose";
import { sanitizeInput } from "@/lib/security";
import { withApiMiddleware } from "@/lib/apiUtils";

// Handler function for PUT /api/notifications/[notificationId]/read
async function markNotificationReadHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const resolvedParams = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sanitize and validate notificationId
    if (!resolvedParams?.notificationId) {
      return NextResponse.json({ error: "Missing notificationId parameter" }, { status: 400 });
    }

    const sanitizedNotificationId = sanitizeInput(resolvedParams.notificationId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedNotificationId)) {
      return NextResponse.json({ error: "Invalid notificationId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the notification
    const notification = await Notification.findById(sanitizedNotificationId);
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Check if the notification belongs to the user
    if (notification.recipient.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "Not authorized to update this notification" },
        { status: 403 }
      );
    }

    // Update the notification
    notification.read = true;
    await notification.save();

    return NextResponse.json(
      {
        success: true,
        message: "Notification marked as read",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PUT /api/notifications/[notificationId]/read] Error:", error);
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 });
  }
}

// Export the handler with middleware
export const PUT = withApiMiddleware(
  async (req: NextRequest) => {
    const notificationId = req.nextUrl.pathname.split("/")[3];
    return markNotificationReadHandler(req, { params: Promise.resolve({ notificationId }) });
  },
  {
    enableRateLimit: true,
    maxRequests: 50,
    windowMs: 60000, // 1 minute
    identifier: "notifications:read:put",
  }
);
