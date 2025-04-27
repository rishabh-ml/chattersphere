// src/app/api/webhook/clerk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

let _dbConnected = false;

export async function POST(req: NextRequest) {
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSig = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSig) {
    console.error("[WEBHOOK] Missing Svix headers");
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const bodyObj = await req.json();
  const bodyRaw = JSON.stringify(bodyObj);

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[WEBHOOK] Missing CLERK_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const wh = new Webhook(secret);
  let evt: { type: string; data: Record<string, unknown> };

  try {
    evt = wh.verify(bodyRaw, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSig,
    }) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!_dbConnected) {
    try {
      await dbConnect();
      _dbConnected = true;
      console.log("[WEBHOOK] Connected to MongoDB");
    } catch (dbErr) {
      console.error("[WEBHOOK] MongoDB connection failed:", dbErr);
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
  }

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const {
        id,
        username,
        email_addresses,
        image_url,
        first_name,
        last_name,
        primary_email_address_id,
      } = evt.data as {
        id: string;
        username?: string;
        email_addresses: Array<{ id: string; email_address: string }>;
        image_url?: string;
        first_name?: string;
        last_name?: string;
        primary_email_address_id?: string;
      };

      const primary = email_addresses.find((e) => e.id === primary_email_address_id);
      const email = primary?.email_address ?? email_addresses[0]?.email_address;
      if (!email) {
        console.error("[WEBHOOK] No primary email found in payload");
        return NextResponse.json({ error: "No email in payload" }, { status: 400 });
      }

      const fullName = [first_name, last_name].filter(Boolean).join(" ").trim();

      try {
        const existingUser = await User.findOne({ clerkId: id });

        if (existingUser) {
          existingUser.username = username ?? existingUser.username;
          existingUser.email = email;
          existingUser.name = fullName || existingUser.name;
          existingUser.image = image_url ?? existingUser.image ?? null;
          await existingUser.save();
          console.log("[WEBHOOK] User updated:", existingUser._id);
          return NextResponse.json({ success: true, operation: "updated" });
        } else {
          const createdUser = await User.create({
            clerkId: id,
            username: username ?? `user_${id.slice(0, 8)}`,
            email,
            name: fullName || username || `user_${id.slice(0, 8)}`,
            image: image_url ?? null,
            following: [],
            followers: [],
            communities: [],
          });
          console.log("[WEBHOOK] User created:", createdUser._id);
          return NextResponse.json({ success: true, operation: "created" }, { status: 201 });
        }
      } catch (dbErr) {
        console.error("[WEBHOOK] Error saving user:", dbErr);
        return NextResponse.json({ error: "Database operation failed" }, { status: 500 });
      }
    }

    case "user.deleted": {
      const { id } = evt.data as { id: string };
      try {
        const deletedUser = await User.findOneAndDelete({ clerkId: id });
        if (!deletedUser) {
          console.error("[WEBHOOK] User not found for deletion");
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        console.log("[WEBHOOK] User deleted:", deletedUser._id);
        return NextResponse.json({ success: true, operation: "deleted" });
      } catch (dbErr) {
        console.error("[WEBHOOK] Error deleting user:", dbErr);
        return NextResponse.json({ error: "Database operation failed" }, { status: 500 });
      }
    }

    default:
      console.log("[WEBHOOK] Ignored event:", evt.type);
      return NextResponse.json({ success: true, message: "Ignored event" });
  }
}
