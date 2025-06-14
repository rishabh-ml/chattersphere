import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import DirectMessage from "@/models/DirectMessage";
import mongoose from "mongoose";
import { invalidateCache, withCache } from "@/lib/redis";
import { withApiMiddleware } from "@/lib/apiUtils";
import { sanitizeInput } from "@/lib/security";
import { z } from "zod";

// Define validation schema for message creation
const messageCreateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message content is required")
    .max(5000, "Message too long; max 5000 chars"),
  attachments: z
    .array(
      z.object({
        url: z.string().url("Invalid attachment URL"),
        type: z.string(),
        name: z.string(),
        size: z.number().positive("File size must be positive"),
      })
    )
    .optional(),
});

/**
 * @api {get} /api/messages/:userId Get messages with a specific user
 * @apiName GetMessages
 * @apiGroup Messages
 * @apiDescription Get messages exchanged with a specific user
 *
 * @apiParam {String} userId ID of the user to get messages with
 *
 * @apiSuccess {Object[]} messages List of messages
 * @apiSuccess {String} messages.id Message ID
 * @apiSuccess {String} messages.content Message content
 * @apiSuccess {Object} messages.sender Sender information
 * @apiSuccess {String} messages.sender.id Sender ID
 * @apiSuccess {String} messages.sender.username Sender username
 * @apiSuccess {String} messages.sender.name Sender name
 * @apiSuccess {String} messages.sender.image Sender profile image
 * @apiSuccess {Object[]} messages.attachments Message attachments
 * @apiSuccess {Boolean} messages.isRead Whether the message has been read
 * @apiSuccess {Date} messages.createdAt Message creation timestamp
 */
async function getMessagesHandler(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const resolvedParams = await params;
  try {
    // Get the authenticated user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sanitize and validate userId
    if (!resolvedParams?.userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const sanitizedUserId = sanitizeInput(resolvedParams.userId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedUserId)) {
      return NextResponse.json({ error: "Invalid userId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the authenticated user
    const currentUser = await User.findOne({ clerkId: clerkUserId });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the other user
    const otherUser = await User.findById(sanitizedUserId);
    if (!otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the other user allows messages
    if (otherUser.privacySettings?.allowMessages === false) {
      return NextResponse.json(
        { error: "This user does not allow direct messages" },
        { status: 403 }
      );
    }

    // Get pagination parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // Create a cache key
    const cacheKey = `messages:${currentUser._id}:${sanitizedUserId}:page:${validPage}:limit:${validLimit}`;

    // Use cache wrapper with a TTL of 30 seconds
    const result = await withCache(
      cacheKey,
      async () => {
        // Find messages between the two users
        const messages = await DirectMessage.find({
          $or: [
            { sender: currentUser._id, recipient: sanitizedUserId },
            { sender: sanitizedUserId, recipient: currentUser._id },
          ],
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(validLimit)
          .populate("sender", "username name image")
          .lean();

        // Count total messages for pagination
        const totalMessages = await DirectMessage.countDocuments({
          $or: [
            { sender: currentUser._id, recipient: sanitizedUserId },
            { sender: sanitizedUserId, recipient: currentUser._id },
          ],
        });

        // Mark messages as read
        await DirectMessage.updateMany(
          {
            sender: sanitizedUserId,
            recipient: currentUser._id,
            isRead: false,
          },
          {
            $set: { isRead: true },
          }
        ); // Format messages for response
        const formattedMessages = messages.map((message: any) => ({
          id: message._id.toString(),
          content: message.content,
          sender: {
            id: message.sender._id.toString(),
            username: message.sender.username,
            name: message.sender.name,
            image: message.sender.image,
          },
          attachments: message.attachments || [],
          isRead: message.isRead,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        }));

        return {
          messages: formattedMessages,
          pagination: {
            page: validPage,
            limit: validLimit,
            totalMessages,
            totalPages: Math.ceil(totalMessages / validLimit),
            hasMore: validPage * validLimit < totalMessages,
          },
        };
      },
      30 // 30 seconds TTL
    );

    // Invalidate conversations cache since we've marked messages as read
    await invalidateCache(`messages:conversations:${currentUser._id}:*`);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[GET /api/messages/[userId]] Error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

/**
 * @api {post} /api/messages/:userId Send a message to a user
 * @apiName SendMessage
 * @apiGroup Messages
 * @apiDescription Send a direct message to a specific user
 *
 * @apiParam {String} userId ID of the user to send a message to
 *
 * @apiBody {String} content Message content
 * @apiBody {Object[]} [attachments] Message attachments
 *
 * @apiSuccess {Object} message The created message
 * @apiSuccess {String} message.id Message ID
 * @apiSuccess {String} message.content Message content
 * @apiSuccess {Object} message.sender Sender information
 * @apiSuccess {Object[]} message.attachments Message attachments
 * @apiSuccess {Boolean} message.isRead Whether the message has been read
 * @apiSuccess {Date} message.createdAt Message creation timestamp
 */
async function sendMessageHandler(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const resolvedParams = await params;
  try {
    // Get the authenticated user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sanitize and validate userId
    if (!resolvedParams?.userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const sanitizedUserId = sanitizeInput(resolvedParams.userId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedUserId)) {
      return NextResponse.json({ error: "Invalid userId format" }, { status: 400 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
      const validatedData = messageCreateSchema.parse(body);
      body = validatedData;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation error",
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    await connectToDatabase();

    // Find the authenticated user
    const currentUser = await User.findOne({ clerkId: clerkUserId });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the recipient
    const recipient = await User.findById(sanitizedUserId);
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // Check if the recipient allows messages
    if (recipient.privacySettings?.allowMessages === false) {
      return NextResponse.json(
        { error: "This user does not allow direct messages" },
        { status: 403 }
      );
    }

    // Create the message
    const message = await DirectMessage.create({
      content: body.content,
      sender: currentUser._id,
      recipient: recipient._id,
      attachments: body.attachments || [],
      isRead: false,
    });

    // Populate sender information
    await message.populate("sender", "username name image");

    // Format the message for response
    const formattedMessage = {
      id: message._id.toString(),
      content: message.content,
      sender: {
        id: message.sender._id.toString(),
        username: message.sender.username,
        name: message.sender.name,
        image: message.sender.image,
      },
      attachments: message.attachments || [],
      isRead: message.isRead,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };

    // Invalidate caches
    await invalidateCache(`messages:${currentUser._id}:${sanitizedUserId}:*`);
    await invalidateCache(`messages:${sanitizedUserId}:${currentUser._id}:*`);    await invalidateCache(`messages:conversations:${currentUser._id}:*`);
    await invalidateCache(`messages:conversations:${sanitizedUserId}:*`);

    // Note: Notification system is implemented via Notification model
    // Message notifications are handled by the notifications API endpoints
    // This could be enhanced to create a notification for new messages

    return NextResponse.json({ message: formattedMessage }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/messages/[userId]] Error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// Export the handler functions with middleware
export const GET = withApiMiddleware(
  async (req: NextRequest) => {
    const userId = req.nextUrl.pathname.split("/")[3];
    return getMessagesHandler(req, { params: Promise.resolve({ userId }) });
  },
  {
    enableRateLimit: true,
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    identifier: "messages:user:get",
  }
);

export const POST = withApiMiddleware(
  async (req: NextRequest) => {
    const userId = req.nextUrl.pathname.split("/")[3];
    return sendMessageHandler(req, { params: Promise.resolve({ userId }) });
  },
  {
    enableRateLimit: true,
    maxRequests: 20,
    windowMs: 60000, // 1 minute
    identifier: "messages:user:post",
  }
);
