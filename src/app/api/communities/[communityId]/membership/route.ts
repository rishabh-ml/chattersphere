// src/app/api/communities/[communityId]/membership/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Community from "@/models/Community";
import Membership, { MembershipStatus } from "@/models/Membership";
import mongoose, { Types } from "mongoose";
import { sanitizeInput } from "@/lib/security";

// POST /api/communities/[communityId]/membership - Toggle community membership
export async function POST(
    req: NextRequest,
    { params }: { params: { communityId: string } }
) {
  try {
    // Clerk auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sanitize and validate communityId
    if (!params?.communityId) {
      return NextResponse.json({ error: "Missing communityId parameter" }, { status: 400 });
    }

    const sanitizedCommunityId = sanitizeInput(params.communityId);

    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId)) {
      return NextResponse.json({ error: "Invalid communityId format" }, { status: 400 });
    }

    await connectToDatabase();

    // Get action from request body if provided, otherwise toggle based on current membership
    let action: string | undefined;
    try {
      const body = await req.json();
      action = body.action;
    } catch (e) {
      // No body or invalid JSON, will determine action based on current membership
    }

    // Lookup current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const me = currentUser._id;

    // Lookup the community
    const community = await Community.findById(sanitizedCommunityId);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check membership status using Membership model
    const Membership = mongoose.model('Membership');
    const membership = await Membership.findOne({
      user: me,
      community: community._id,
      status: MembershipStatus.ACTIVE
    });

    // Fallback to the deprecated array if Membership model fails
    const isMember = membership ? true : community.members.some((memberId) =>
      memberId.toString() === me.toString()
    );

    // If action wasn't specified in the request, determine it based on current membership
    if (!action) {
      action = isMember ? "leave" : "join";
    }

    // Validate action
    if (action !== "join" && action !== "leave") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Prevent creator from leaving
    if (action === "leave" && community.creator.toString() === me.toString()) {
      return NextResponse.json(
        { error: "Community creator cannot leave" },
        { status: 403 }
      );
    }

    // Check for invalid state
    if (action === "join" && isMember) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }
    if (action === "leave" && !isMember) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 });
    }

    // Perform join/leave
    if (action === "join") {
      // Check if the community requires approval for new members
      if (community.requiresApproval) {
        // Check if a membership request already exists
        const Membership = mongoose.model('Membership');
        const existingRequest = await Membership.findOne({
          user: me,
          community: community._id
        });

        if (existingRequest) {
          if (existingRequest.status === MembershipStatus.PENDING) {
            return NextResponse.json({
              error: "You already have a pending request to join this community"
            }, { status: 400 });
          } else if (existingRequest.status === MembershipStatus.ACTIVE) {
            return NextResponse.json({
              error: "You are already a member of this community"
            }, { status: 400 });
          } else if (existingRequest.status === MembershipStatus.REJECTED) {
            // Update the existing rejected request to pending
            existingRequest.status = MembershipStatus.PENDING;
            await existingRequest.save();
          }
        } else {
          // Create a new membership request with PENDING status
          await Membership.create({
            user: me,
            community: community._id,
            status: MembershipStatus.PENDING,
            joinedAt: new Date()
          });
        }

        // Notify community moderators and creator about the join request
        try {
          const Notification = mongoose.model('Notification');

          // Notify the community creator
          await Notification.create({
            recipient: community.creator,
            sender: me,
            type: 'community_join',
            message: `${currentUser.name} requested to join your community ${community.name}`,
            read: false,
            relatedCommunity: community._id
          });

          // Notify all moderators (except the creator to avoid duplicate notifications)
          for (const modId of community.moderators) {
            if (modId.toString() !== community.creator.toString()) {
              await Notification.create({
                recipient: modId,
                sender: me,
                type: 'community_join',
                message: `${currentUser.name} requested to join community ${community.name}`,
                read: false,
                relatedCommunity: community._id
              });
            }
          }
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
          // Continue even if notification creation fails
        }

        // Return success with pending status
        return NextResponse.json(
          {
            success: true,
            action: "request",
            memberCount: await Membership.countDocuments({
              community: community._id,
              status: MembershipStatus.ACTIVE
            }),
            isMember: false,
            status: MembershipStatus.PENDING
          },
          { status: 202 }
        );
      } else {
        // Community doesn't require approval, add user directly
        await Community.findByIdAndUpdate(sanitizedCommunityId, {
          $addToSet: { members: me },
        });
        await User.findByIdAndUpdate(me, {
          $addToSet: { communities: community._id },
        });

        // Create or update membership record
        const Membership = mongoose.model('Membership');
        await Membership.findOneAndUpdate(
          { user: me, community: community._id },
          {
            status: MembershipStatus.ACTIVE,
            joinedAt: new Date()
          },
          { upsert: true }
        );
      }
    } else {
      // Handle leave action
      await Community.findByIdAndUpdate(sanitizedCommunityId, {
        $pull: { members: me, moderators: me },
      });
      await User.findByIdAndUpdate(me, {
        $pull: { communities: community._id },
      });

      // Update membership status if exists
      try {
        const Membership = mongoose.model('Membership');
        await Membership.findOneAndDelete({
          user: me,
          community: community._id
        });
      } catch (membershipError) {
        console.error("Error updating membership:", membershipError);
        // Continue even if membership update fails
      }
    }

    // Fetch updated member count using Membership model
    const memberCount = await Membership.countDocuments({
      community: community._id,
      status: MembershipStatus.ACTIVE
    });

    // Create notification for join (if applicable)
    if (action === "join") {
      try {
        const Notification = mongoose.model('Notification');
        await Notification.create({
          recipient: community.creator,
          sender: me,
          type: 'community_join',
          message: `${currentUser.name} joined your community ${community.name}`,
          read: false,
          relatedCommunity: community._id
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Continue even if notification creation fails
      }
    }

    // Return success payload
    return NextResponse.json(
      {
        success: true,
        action,
        memberCount,
        isMember: action === "join",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[MEMBERSHIP.POST] Error:", err);
    return NextResponse.json(
        { error: "Failed to update membership" },
        { status: 500 }
    );
  }
}
