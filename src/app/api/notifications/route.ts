import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Notification from "@/models/Notification";
import mongoose from "mongoose";
import { withApiMiddleware } from "@/lib/apiUtils";

// HEAD /api/notifications - Check if the notifications API is available
export async function HEAD() {
  return new Response(null, { status: 200 });
}

// Handler function for GET /api/notifications
async function getNotificationsHandler(req: NextRequest) {
  try {

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error("[GET /api/notifications] Database connection error:", dbError);
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
        pagination: {
          page: 1,
          limit: 20,
          totalNotifications: 0,
          hasMore: false,
        },
      });
    }

    // Find the user
    let user;
    try {
      user = await User.findOne({ clerkId: userId });
      if (!user) {
        return NextResponse.json({
          notifications: [],
          unreadCount: 0,
          pagination: {
            page: 1,
            limit: 20,
            totalNotifications: 0,
            hasMore: false,
          },
        });
      }
    } catch (userError) {
      console.error("[GET /api/notifications] User lookup error:", userError);
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
        pagination: {
          page: 1,
          limit: 20,
          totalNotifications: 0,
          hasMore: false,
        },
      });
    }

    // Parse query parameters
    const url = req.nextUrl;
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { recipient: user._id };
    if (unreadOnly) {
      query.read = false;
    }

    // Fetch notifications
    let notifications = [];
    let total = 0;
    let unreadCount = 0;

    try {
      // Check if Notification model exists
      if (mongoose.models.Notification) {
        notifications = await Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("sender", "username name image")
          .populate("relatedPost", "content")
          .populate("relatedComment", "content")
          .populate("relatedCommunity", "name image")
          .lean();

        // Count total notifications and unread count
        total = await Notification.countDocuments(query);
        unreadCount = await Notification.countDocuments({
          recipient: user._id,
          read: false
        });
      }
    } catch (notificationError) {
      console.error("[GET /api/notifications] Notification fetch error:", notificationError);
      // Continue with empty notifications
    }

    // Format notifications for response
    const formattedNotifications = notifications.map(notification => ({
      id: notification._id.toString(),
      type: notification.type,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      sender: notification.sender ? {
        id: notification.sender._id.toString(),
        username: notification.sender.username,
        name: notification.sender.name,
        image: notification.sender.image,
      } : undefined,
      relatedPost: notification.relatedPost ? {
        id: notification.relatedPost._id.toString(),
        content: notification.relatedPost.content.substring(0, 100) + (notification.relatedPost.content.length > 100 ? '...' : ''),
      } : undefined,
      relatedComment: notification.relatedComment ? {
        id: notification.relatedComment._id.toString(),
        content: notification.relatedComment.content.substring(0, 100) + (notification.relatedComment.content.length > 100 ? '...' : ''),
      } : undefined,
      relatedCommunity: notification.relatedCommunity ? {
        id: notification.relatedCommunity._id.toString(),
        name: notification.relatedCommunity.name,
        image: notification.relatedCommunity.image,
      } : undefined,
    }));

    return NextResponse.json(
      {
        notifications: formattedNotifications,
        unreadCount,
        pagination: {
          page,
          limit,
          totalNotifications: total,
          hasMore: total > skip + notifications.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/notifications] Error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// Export the handler with middleware
export const GET = withApiMiddleware(getNotificationsHandler, {
  enableRateLimit: true,
  maxRequests: 20,
  windowMs: 60000, // 1 minute
  identifier: 'notifications:get'
});
