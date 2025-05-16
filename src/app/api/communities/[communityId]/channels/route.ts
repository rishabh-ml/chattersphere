import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import Community from "@/models/Community";
import Channel, { ChannelType } from "@/models/Channel";
import User from "@/models/User";
import { ApiError } from "@/lib/api-error";
import { sanitizeInput } from "@/lib/security";
import mongoose from "mongoose";
import { z } from "zod";

// Validation schema for creating a channel
const createChannelSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().max(1000, "Description must be 1000 characters or less").optional(),
  type: z.enum([ChannelType.TEXT, ChannelType.VOICE, ChannelType.ANNOUNCEMENT]).default(ChannelType.TEXT),
  isPrivate: z.boolean().default(false),
});

// GET /api/communities/[communityId]/channels - Get all channels for a community
export async function GET(
  _req: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    // Sanitize and validate communityId
    if (!params?.communityId) {
      return ApiError.badRequest("Missing communityId parameter");
    }
    
    const sanitizedCommunityId = sanitizeInput(params.communityId);
    
    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId)) {
      return ApiError.badRequest("Invalid communityId format");
    }

    await connectToDatabase();

    // Find the community
    const community = await Community.findById(sanitizedCommunityId).lean().exec();
    
    if (!community) {
      return ApiError.notFound("Community not found");
    }

    // Check if the community is private and the user is not a member
    if (community.isPrivate) {
      if (!clerkUserId) {
        return ApiError.unauthorized("You must be signed in to view channels in a private community");
      }

      const currentUser = await User.findOne({ clerkId: clerkUserId }).lean().exec();
      
      if (!currentUser) {
        return ApiError.unauthorized("User not found");
      }

      const currentUserId = currentUser._id.toString();
      const isMember = community.members.some(
        (id: any) => id.toString() === currentUserId
      );
      
      if (!isMember) {
        return ApiError.forbidden("You must be a member to view channels in this community");
      }
    }

    // Find all channels for the community
    const channels = await Channel.find({ community: sanitizedCommunityId })
      .sort({ type: 1, name: 1 })
      .lean()
      .exec();

    // Format the response
    const formattedChannels = channels.map(channel => ({
      id: channel._id.toString(),
      name: channel.name,
      slug: channel.slug,
      description: channel.description || "",
      type: channel.type,
      isPrivate: channel.isPrivate,
      messageCount: channel.messages?.length || 0,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString(),
    }));

    return NextResponse.json({ channels: formattedChannels }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/communities/[communityId]/channels] Error:", err);
    return ApiError.internalServerError("Failed to fetch channels");
  }
}

// POST /api/communities/[communityId]/channels - Create a new channel
export async function POST(
  req: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return ApiError.unauthorized("You must be signed in to create a channel");
    }

    // Sanitize and validate communityId
    if (!params?.communityId) {
      return ApiError.badRequest("Missing communityId parameter");
    }
    
    const sanitizedCommunityId = sanitizeInput(params.communityId);
    
    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId)) {
      return ApiError.badRequest("Invalid communityId format");
    }

    await connectToDatabase();

    // Find the community
    const community = await Community.findById(sanitizedCommunityId);
    
    if (!community) {
      return ApiError.notFound("Community not found");
    }

    // Find the current user
    const currentUser = await User.findOne({ clerkId: clerkUserId }).lean().exec();
    
    if (!currentUser) {
      return ApiError.unauthorized("User not found");
    }

    const currentUserId = currentUser._id.toString();

    // Check if the user has permission to create a channel (creator or moderator)
    const isCreator = community.creator.toString() === currentUserId;
    const isModerator = community.moderators.some(
      (id: any) => id.toString() === currentUserId
    );

    if (!isCreator && !isModerator) {
      return ApiError.forbidden("You don't have permission to create channels in this community");
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = createChannelSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');

      return ApiError.badRequest("Validation error", { details: errorMessage });
    }

    const { name, description, type, isPrivate } = validationResult.data;

    // Create a slug from the name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check if a channel with the same slug already exists in this community
    const existingChannel = await Channel.findOne({
      community: sanitizedCommunityId,
      slug,
    }).lean().exec();

    if (existingChannel) {
      return ApiError.conflict("A channel with this name already exists in this community");
    }

    // Create the new channel
    const newChannel = await Channel.create({
      name,
      slug,
      description,
      type,
      isPrivate,
      community: sanitizedCommunityId,
    });

    // Add the channel to the community
    community.channels.push(newChannel._id);
    await community.save();

    // Format the response
    const formattedChannel = {
      id: newChannel._id.toString(),
      name: newChannel.name,
      slug: newChannel.slug,
      description: newChannel.description || "",
      type: newChannel.type,
      isPrivate: newChannel.isPrivate,
      messageCount: 0,
      createdAt: newChannel.createdAt.toISOString(),
      updatedAt: newChannel.updatedAt.toISOString(),
    };

    return NextResponse.json({ channel: formattedChannel }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/communities/[communityId]/channels] Error:", err);
    return ApiError.internalServerError("Failed to create channel");
  }
}
