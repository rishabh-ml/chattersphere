import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import DirectMessage from "@/models/DirectMessage";
import { withApiMiddleware } from "@/lib/apiUtils";

/**
 * GET /api/messages/unread/count - Get count of unread messages
 */
async function getUnreadCountHandler(req: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Find the user in our database
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Count unread messages
    const unreadCount = await DirectMessage.countDocuments({
      recipient: user._id,
      isRead: false,
    });

    return NextResponse.json({ count: unreadCount }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/messages/unread/count] Error:", error);
    return NextResponse.json({ error: "Failed to get unread message count" }, { status: 500 });
  }
}

// Export the handler with middleware
export const GET = withApiMiddleware(getUnreadCountHandler, {
  enableRateLimit: true,
  maxRequests: 60,
  windowMs: 60000, // 1 minute
  identifier: "messages:unread:count:get",
});
