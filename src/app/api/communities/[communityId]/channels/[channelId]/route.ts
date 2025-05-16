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

// Validation schema for updating a channel
const updateChannelSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less").optional(),
  description: z.string().max(1000, "Description must be 1000 characters or less").optional(),
  type: z.enum([ChannelType.TEXT, ChannelType.VOICE, ChannelType.ANNOUNCEMENT]).optional(),
  isPrivate: z.boolean().optional(),
});

// GET /api/communities/[communityId]/channels/[channelId] - Get a specific channel
export async function GET(
  _req: NextRequest,
  { params }: { params: { communityId: string; channelId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    // Sanitize and validate parameters
    if (!params?.communityId || !params?.channelId) {
      return ApiError.badRequest("Missing required parameters");
    }
    
    const sanitizedCommunityId = sanitizeInput(params.communityId);
    const sanitizedChannelId = sanitizeInput(params.channelId);
    
    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId) || 
        !mongoose.Types.ObjectId.isValid(sanitizedChannelId)) {
      return ApiError.badRequest("Invalid ID format");
    }

    await connectToDatabase();

    // Find the channel
    const channel = await Channel.findOne({
      _id: sanitizedChannelId,
      community: sanitizedCommunityId,
    }).lean().exec();
    
    if (!channel) {
      return ApiError.notFound("Channel not found");
    }

    // Check if the channel is private and the user has access
    if (channel.isPrivate) {
      if (!clerkUserId) {
        return ApiError.unauthorized("You must be signed in to view this channel");
      }

      const currentUser = await User.findOne({ clerkId: clerkUserId }).lean().exec();
      
      if (!currentUser) {
        return ApiError.unauthorized("User not found");
      }

      const currentUserId = currentUser._id.toString();

      // Find the community to check if user is creator or moderator
      const community = await Community.findById(sanitizedCommunityId).lean().exec();
      
      if (!community) {
        return ApiError.notFound("Community not found");
      }

      const isCreator = community.creator.toString() === currentUserId;
      const isModerator = community.moderators.some(
        (id: any) => id.toString() === currentUserId
      );

      // Check if user is allowed to access this private channel
      const hasAccess = isCreator || isModerator || channel.allowedUsers.some(
        (id: any) => id.toString() === currentUserId
      );

      if (!hasAccess) {
        return ApiError.forbidden("You don't have permission to view this channel");
      }
    }

    // Format the response
    const formattedChannel = {
      id: channel._id.toString(),
      name: channel.name,
      slug: channel.slug,
      description: channel.description || "",
      type: channel.type,
      isPrivate: channel.isPrivate,
      messageCount: channel.messages?.length || 0,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString(),
    };

    return NextResponse.json({ channel: formattedChannel }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/communities/[communityId]/channels/[channelId]] Error:", err);
    return ApiError.internalServerError("Failed to fetch channel");
  }
}

// PUT /api/communities/[communityId]/channels/[channelId] - Update a channel
export async function PUT(
  req: NextRequest,
  { params }: { params: { communityId: string; channelId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return ApiError.unauthorized("You must be signed in to update a channel");
    }

    // Sanitize and validate parameters
    if (!params?.communityId || !params?.channelId) {
      return ApiError.badRequest("Missing required parameters");
    }
    
    const sanitizedCommunityId = sanitizeInput(params.communityId);
    const sanitizedChannelId = sanitizeInput(params.channelId);
    
    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId) || 
        !mongoose.Types.ObjectId.isValid(sanitizedChannelId)) {
      return ApiError.badRequest("Invalid ID format");
    }

    await connectToDatabase();

    // Find the channel
    const channel = await Channel.findOne({
      _id: sanitizedChannelId,
      community: sanitizedCommunityId,
    });
    
    if (!channel) {
      return ApiError.notFound("Channel not found");
    }

    // Find the current user
    const currentUser = await User.findOne({ clerkId: clerkUserId }).lean().exec();
    
    if (!currentUser) {
      return ApiError.unauthorized("User not found");
    }

    const currentUserId = currentUser._id.toString();

    // Find the community to check if user is creator or moderator
    const community = await Community.findById(sanitizedCommunityId).lean().exec();
    
    if (!community) {
      return ApiError.notFound("Community not found");
    }

    const isCreator = community.creator.toString() === currentUserId;
    const isModerator = community.moderators.some(
      (id: any) => id.toString() === currentUserId
    );

    // Check if the user has permission to update the channel
    if (!isCreator && !isModerator) {
      return ApiError.forbidden("You don't have permission to update this channel");
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = updateChannelSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');

      return ApiError.badRequest("Validation error", { details: errorMessage });
    }

    const { name, description, type, isPrivate } = validationResult.data;

    // If name is being updated, create a new slug
    let slug = channel.slug;
    if (name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Check if a channel with the same slug already exists in this community (excluding this channel)
      const existingChannel = await Channel.findOne({
        _id: { $ne: sanitizedChannelId },
        community: sanitizedCommunityId,
        slug,
      }).lean().exec();

      if (existingChannel) {
        return ApiError.conflict("A channel with this name already exists in this community");
      }
    }

    // Update the channel
    const updatedChannel = await Channel.findByIdAndUpdate(
      sanitizedChannelId,
      {
        $set: {
          ...(name && { name, slug }),
          ...(description !== undefined && { description }),
          ...(type && { type }),
          ...(isPrivate !== undefined && { isPrivate }),
        },
      },
      { new: true }
    ).lean().exec();

    // Format the response
    const formattedChannel = {
      id: updatedChannel._id.toString(),
      name: updatedChannel.name,
      slug: updatedChannel.slug,
      description: updatedChannel.description || "",
      type: updatedChannel.type,
      isPrivate: updatedChannel.isPrivate,
      messageCount: updatedChannel.messages?.length || 0,
      createdAt: updatedChannel.createdAt.toISOString(),
      updatedAt: updatedChannel.updatedAt.toISOString(),
    };

    return NextResponse.json({ channel: formattedChannel }, { status: 200 });
  } catch (err) {
    console.error("[PUT /api/communities/[communityId]/channels/[channelId]] Error:", err);
    return ApiError.internalServerError("Failed to update channel");
  }
}

// DELETE /api/communities/[communityId]/channels/[channelId] - Delete a channel
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { communityId: string; channelId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return ApiError.unauthorized("You must be signed in to delete a channel");
    }

    // Sanitize and validate parameters
    if (!params?.communityId || !params?.channelId) {
      return ApiError.badRequest("Missing required parameters");
    }
    
    const sanitizedCommunityId = sanitizeInput(params.communityId);
    const sanitizedChannelId = sanitizeInput(params.channelId);
    
    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId) || 
        !mongoose.Types.ObjectId.isValid(sanitizedChannelId)) {
      return ApiError.badRequest("Invalid ID format");
    }

    await connectToDatabase();

    // Find the channel
    const channel = await Channel.findOne({
      _id: sanitizedChannelId,
      community: sanitizedCommunityId,
    });
    
    if (!channel) {
      return ApiError.notFound("Channel not found");
    }

    // Find the current user
    const currentUser = await User.findOne({ clerkId: clerkUserId }).lean().exec();
    
    if (!currentUser) {
      return ApiError.unauthorized("User not found");
    }

    const currentUserId = currentUser._id.toString();

    // Find the community to check if user is creator or moderator
    const community = await Community.findById(sanitizedCommunityId);
    
    if (!community) {
      return ApiError.notFound("Community not found");
    }

    const isCreator = community.creator.toString() === currentUserId;
    const isModerator = community.moderators.some(
      (id: any) => id.toString() === currentUserId
    );

    // Check if the user has permission to delete the channel
    if (!isCreator && !isModerator) {
      return ApiError.forbidden("You don't have permission to delete this channel");
    }

    // Delete the channel
    await Channel.findByIdAndDelete(sanitizedChannelId);

    // Remove the channel from the community
    community.channels = community.channels.filter(
      (id: any) => id.toString() !== sanitizedChannelId
    );
    await community.save();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/communities/[communityId]/channels/[channelId]] Error:", err);
    return ApiError.internalServerError("Failed to delete channel");
  }
}
