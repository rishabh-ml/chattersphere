import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import { sanitizeInput } from "@/lib/security";
import { withApiMiddleware } from "@/lib/apiUtils";

/**
 * @api {get} /api/users/search Search for users
 * @apiName SearchUsers
 * @apiGroup Users
 * @apiDescription Search for users by name or username
 * 
 * @apiQuery {String} q Search query
 * 
 * @apiSuccess {Object[]} users List of users matching the search query
 * @apiSuccess {String} users.id User ID
 * @apiSuccess {String} users.username Username
 * @apiSuccess {String} users.name Name
 * @apiSuccess {String} users.image Profile image
 */
async function searchUsersHandler(req: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get search query
    const url = new URL(req.url);
    const query = url.searchParams.get("q");
    
    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    const sanitizedQuery = sanitizeInput(query);

    await connectToDatabase();

    // Find the authenticated user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Search for users
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUser._id } }, // Exclude current user
        {
          $or: [
            { name: { $regex: sanitizedQuery, $options: "i" } },
            { username: { $regex: sanitizedQuery, $options: "i" } }
          ]
        }
      ]
    })
      .select("username name image privacySettings")
      .limit(20)
      .lean();

    // Filter out users who don't allow messages
    const filteredUsers = users.filter(user => 
      user.privacySettings?.allowMessages !== false
    );

    // Format users for response
    const formattedUsers = filteredUsers.map(user => ({
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      image: user.image
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/users/search] Error:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}

// Export the handler function with middleware
export const GET = withApiMiddleware(searchUsersHandler, {
  enableRateLimit: true,
  maxRequests: 50,
  windowMs: 60000, // 1 minute
  identifier: 'users:search:get'
});
