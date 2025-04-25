// src/app/api/webhook/clerk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";

// We’ll eagerly connect once
let _dbConnected = false;

export async function POST(req: NextRequest) {
  // 1) Grab raw headers off of the incoming request
  const svixId       = req.headers.get("svix-id");
  const svixTimestamp= req.headers.get("svix-timestamp");
  const svixSig      = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSig) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  // 2) Read & stringify the JSON body
  const bodyObj = await req.json();
  const bodyRaw = JSON.stringify(bodyObj);

  // 3) Verify with your Clerk webhook secret
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

  // 4) Ensure DB
  if (!_dbConnected) {
    await connectToDatabase();
    _dbConnected = true;
  }

  // 5) Dispatch on event type
  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      // pull strongly typed fields from evt.data
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

      // pick the primary or fallback email
      const primary = email_addresses.find((e) => e.id === primary_email_address_id);
      const email  = primary?.email_address ?? email_addresses[0]?.email_address;
      if (!email) {
        return NextResponse.json({ error: "No email in payload" }, { status: 400 });
      }

      try {
        const existing = await User.findOne({ clerkId: id });
        const name = [first_name, last_name].filter(Boolean).join(" ").trim();

        if (existing) {
          existing.username = username ?? existing.username;
          existing.email    = email;
          existing.name     = name || existing.name;
          existing.image    = image_url ?? existing.image;
          await existing.save();
          return NextResponse.json({ success: true, operation: "updated" });
        } else {
          await User.create({
            clerkId: id,
            username: username ?? `user_${id.slice(0, 8)}`,
            email,
            name:    name || username || `user_${id.slice(0, 8)}`,
            image:   image_url,
            following: [],
            followers: [],
            communities: [],
          });
          return NextResponse.json({ success: true, operation: "created" }, { status: 201 });
        }
      } catch (dbErr) {
        console.error("[WEBHOOK] DB error on create/update user:", dbErr);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    case "user.deleted": {
      const { id } = evt.data as { id: string };
      try {
        const removed = await User.findOneAndDelete({ clerkId: id });
        if (!removed) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, operation: "deleted" });
      } catch (dbErr) {
        console.error("[WEBHOOK] DB error on delete user:", dbErr);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
    }

    default:
      // we don’t care about other events
      return NextResponse.json({ success: true, message: "Ignored event" });
  }
}
