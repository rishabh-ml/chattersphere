import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import DirectMessage from "@/models/DirectMessage";
import mongoose from "mongoose";
import { withCache } from "@/lib/redis";
import { withApiMiddleware } from "@/lib/apiUtils";

/**
 * @api {get} /api/messages Get user conversations
 * @apiName GetConversations
 * @apiGroup Messages
 * @apiDescription Get a list of conversations for the authenticated user
 *
 * @apiSuccess {Object[]} conversations List of conversations
 * @apiSuccess {String} conversations.userId User ID of the conversation partner
 * @apiSuccess {String} conversations.username Username of the conversation partner
 * @apiSuccess {String} conversations.name Name of the conversation partner
 * @apiSuccess {String} conversations.image Profile image of the conversation partner
 * @apiSuccess {String} conversations.lastMessage Last message in the conversation
 * @apiSuccess {Date} conversations.lastMessageAt Timestamp of the last message
 * @apiSuccess {Number} conversations.unreadCount Number of unread messages
 */
async function getConversationsHandler(req: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get pagination parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // Create a cache key
    const cacheKey = `messages:conversations:${user._id}:page:${validPage}:limit:${validLimit}`;

    // Use cache wrapper with a shorter TTL to prevent stale data
    const conversations = await withCache(
      cacheKey,
      async () => {
        // Check if the DirectMessage model exists
        if (!mongoose.models.DirectMessage) {
          return [];
        }

        // Find all users the current user has exchanged messages with
        const conversationPartners = await DirectMessage.aggregate([
          {
            $match: {
              $or: [{ sender: user._id }, { recipient: user._id }],
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $group: {
              _id: {
                $cond: [{ $eq: ["$sender", user._id] }, "$recipient", "$sender"],
              },
              lastMessage: { $first: "$content" },
              lastMessageAt: { $first: "$createdAt" },
              lastMessageId: { $first: "$_id" },
              unreadCount: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ["$recipient", user._id] }, { $eq: ["$isRead", false] }] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: "$user",
          },
          {
            $project: {
              _id: 0,
              userId: "$_id",
              username: "$user.username",
              name: "$user.name",
              image: "$user.image",
              lastMessage: 1,
              lastMessageAt: 1,
              lastMessageId: 1,
              unreadCount: 1,
            },
          },
          {
            $sort: { lastMessageAt: -1 },
          },
          {
            $skip: skip,
          },
          {
            $limit: validLimit,
          },
        ]);

        return conversationPartners;
      },
      30 // 30 seconds TTL to ensure fresher data
    );

    return NextResponse.json({ conversations: conversations || [] }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/messages] Error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

// Export the handler functions with middleware
export const GET = withApiMiddleware(getConversationsHandler, {
  enableRateLimit: true,
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  identifier: "messages:get",
});
