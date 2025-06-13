// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Types } from "mongoose";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { withApiMiddleware } from "@/lib/apiUtils";
import { getPaginationOptions } from "@/lib/mongooseUtils";

interface LeanNotification {
  _id: Types.ObjectId;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  sender?: {
    _id: Types.ObjectId;
    username: string;
    name: string;
    image?: string;
  };
  relatedPost?: {
    _id: Types.ObjectId;
    content: string;
  };
  relatedComment?: {
    _id: Types.ObjectId;
    content: string;
  };
  relatedCommunity?: {
    _id: Types.ObjectId;
    name: string;
    image?: string;
  };
}

// HEAD /api/notifications — health check
export async function HEAD() {
  return new Response(null, { status: 200 });
}

// GET /api/notifications
async function getNotificationsHandler(req: NextRequest) {
  // 1) Auth
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Pagination & filters
  const url = req.nextUrl;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
  const { skip, limit: validLimit } = getPaginationOptions(page, limit);
  const unreadOnly = url.searchParams.get("unreadOnly") === "true";

  // 3) DB connect
  await connectToDatabase();

  // 4) Load user
  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    // empty response if user not found
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
      pagination: { page, limit: validLimit, totalNotifications: 0, hasMore: false },
    });
  }

  const recipientId = user._id;

  // 5) Build query
  const query: Record<string, unknown> = { recipient: recipientId };
  if (unreadOnly) query.read = false;

  // 6) Fetch notifications + counts in parallel
  const [rawList, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validLimit)
      .populate("sender", "username name image")
      .populate("relatedPost", "content")
      .populate("relatedComment", "content")
      .populate("relatedCommunity", "name image")
      .lean<LeanNotification[]>(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: recipientId, read: false }),
  ]);

  // 7) Format for client
  const notifications = rawList.map((n) => ({
    id: n._id.toString(),
    type: n.type,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    sender: n.sender && {
      id: n.sender._id.toString(),
      username: n.sender.username,
      name: n.sender.name,
      image: n.sender.image ?? null,
    },
    relatedPost: n.relatedPost && {
      id: n.relatedPost._id.toString(),
      content:
        n.relatedPost.content.length > 100
          ? n.relatedPost.content.slice(0, 100) + "…"
          : n.relatedPost.content,
    },
    relatedComment: n.relatedComment && {
      id: n.relatedComment._id.toString(),
      content:
        n.relatedComment.content.length > 100
          ? n.relatedComment.content.slice(0, 100) + "…"
          : n.relatedComment.content,
    },
    relatedCommunity: n.relatedCommunity && {
      id: n.relatedCommunity._id.toString(),
      name: n.relatedCommunity.name,
      image: n.relatedCommunity.image ?? null,
    },
  }));

  return NextResponse.json({
    notifications,
    unreadCount,
    pagination: {
      page,
      limit: validLimit,
      totalNotifications: total,
      hasMore: skip + notifications.length < total,
    },
  });
}

// wrap in your API middleware (rate limits, etc.)
export const GET = withApiMiddleware(getNotificationsHandler, {
  enableRateLimit: true,
  maxRequests: 20,
  windowMs: 60_000,
  identifier: "notifications:get",
});
