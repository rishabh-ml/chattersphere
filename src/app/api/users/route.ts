import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";

// GET /api/users - Get user by clerkId
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const clerkId = url.searchParams.get("clerkId");

    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId parameter" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the user by clerkId
    const user = await User.findOne({ clerkId }).lean().exec();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          username: user.username,
          name: user.name,
          image: user.image,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/users] Error:", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
