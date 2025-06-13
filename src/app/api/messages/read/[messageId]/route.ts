import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import DirectMessage from "@/models/DirectMessage";
import mongoose from "mongoose";
import { invalidateCache } from "@/lib/redis";
import { withApiMiddleware } from "@/lib/apiUtils";
import { sanitizeInput } from "@/lib/security";

/**
 * @api {put} /api/messages/read/:messageId Mark a message as read
 * @apiName MarkMessageRead
 * @apiGroup Messages
 * @apiDescription Mark a specific message as read
 * 
 * @apiParam {String} messageId ID of the message to mark as read
 * 
 * @apiSuccess {Object} message The updated message
 * @apiSuccess {String} message.id Message ID
 * @apiSuccess {Boolean} message.isRead Whether the message has been read
 */
async function markMessageReadHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const resolvedParams = await params;
  try {
    // Get the authenticated user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sanitize and validate messageId
    if (!resolvedParams?.messageId) {
      return NextResponse.json({ error: "Missing messageId parameter" }, { status: 400 });
    }

    const sanitizedMessageId = sanitizeInput(resolvedParams.messageId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedMessageId)) {
      return NextResponse.json({ error: "Invalid messageId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the authenticated user
    const currentUser = await User.findOne({ clerkId: clerkUserId });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the message
    const message = await DirectMessage.findById(sanitizedMessageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if the user is the recipient of the message
    if (message.recipient.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: "You can only mark messages sent to you as read" }, { status: 403 });
    }

    // If the message is already read, return success
    if (message.isRead) {
      return NextResponse.json({ 
        message: {
          id: message._id.toString(),
          isRead: true
        }
      }, { status: 200 });
    }

    // Mark the message as read
    message.isRead = true;
    await message.save();

    // Invalidate caches
    await invalidateCache(`messages:${currentUser._id}:${message.sender}:*`);
    await invalidateCache(`messages:conversations:${currentUser._id}:*`);

    return NextResponse.json({ 
      message: {
        id: message._id.toString(),
        isRead: true
      }
    }, { status: 200 });
  } catch (error) {
    console.error("[PUT /api/messages/read/[messageId]] Error:", error);
    return NextResponse.json({ error: "Failed to mark message as read" }, { status: 500 });
  }
}

// Export the handler function with middleware
export const PUT = withApiMiddleware(
  (req: NextRequest) => markMessageReadHandler(req, { params: { messageId: req.nextUrl.pathname.split('/')[4] } }),
  {
    enableRateLimit: true,
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    identifier: 'messages:read:put'
  }
);
