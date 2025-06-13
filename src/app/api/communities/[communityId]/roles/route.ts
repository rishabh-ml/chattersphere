import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import Community from "@/models/Community";
import User from "@/models/User";
import Role from "@/models/Role";
import { ApiError } from "@/lib/api-error";
import { sanitizeInput } from "@/lib/security";
import mongoose from "mongoose";
import { z } from "zod";

// Validation schema for creating a role
const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required").max(32, "Name must be 32 characters or less"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color code"),
  permissions: z.record(z.boolean()).optional(),
  position: z.number().int().min(0).optional(),
});

// GET /api/communities/[communityId]/roles - Get all roles for a community
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const resolvedParams = await params;
  try {
    const { userId: clerkUserId } = await auth();
    
    // Sanitize and validate communityId
    if (!resolvedParams?.communityId) {
      return ApiError.badRequest("Missing communityId parameter");
    }
    
    const sanitizedCommunityId = sanitizeInput(resolvedParams.communityId);
    
    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId)) {
      return ApiError.badRequest("Invalid communityId format");
    }

    await connectToDatabase();    // Find the community
    const community = await Community.findById(sanitizedCommunityId).lean().exec() as any;
    
    if (!community) {
      return ApiError.notFound("Community not found");
    }

    // Check if the user has permission to view roles
    let hasPermission = false;    if (clerkUserId) {
      const currentUser = await User.findOne({ clerkId: clerkUserId }).lean().exec() as any;
      
      if (currentUser) {
        const currentUserId = currentUser._id.toString();
        
        // Check if the user is a member, moderator, or creator
        const isMember = community.members.some(
          (id: any) => id.toString() === currentUserId
        );
        
        hasPermission = isMember;
      }
    }

    // If the community is not private, anyone can view roles
    if (!community.isPrivate) {
      hasPermission = true;
    }

    if (!hasPermission) {
      return ApiError.forbidden("You must be a member to view roles in this community");
    }

    // Find all roles for the community
    const roles = await Role.find({ community: sanitizedCommunityId })
      .sort({ position: -1 })
      .lean()
      .exec();    // Format the response
    const formattedRoles = roles.map((role: any) => ({
      id: role._id.toString(),
      name: role.name,
      color: role.color,
      position: role.position,
      isDefault: role.isDefault,
      permissions: role.permissions,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }));

    return NextResponse.json({ roles: formattedRoles }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/communities/[communityId]/roles] Error:", err);
    return ApiError.internalServerError("Failed to fetch roles");
  }
}

// POST /api/communities/[communityId]/roles - Create a new role
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const resolvedParams = await params;
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return ApiError.unauthorized("You must be signed in to create a role");
    }

    // Sanitize and validate communityId
    if (!resolvedParams?.communityId) {
      return ApiError.badRequest("Missing communityId parameter");
    }
    
    const sanitizedCommunityId = sanitizeInput(resolvedParams.communityId);
    
    if (!mongoose.Types.ObjectId.isValid(sanitizedCommunityId)) {
      return ApiError.badRequest("Invalid communityId format");
    }

    await connectToDatabase();

    // Find the community
    const community = await Community.findById(sanitizedCommunityId);
    
    if (!community) {
      return ApiError.notFound("Community not found");
    }    // Find the current user
    const currentUser = await User.findOne({ clerkId: clerkUserId }).lean().exec() as any;
    
    if (!currentUser) {
      return ApiError.unauthorized("User not found");
    }

    const currentUserId = currentUser._id.toString();

    // Check if the user has permission to create a role (creator or moderator)
    const isCreator = community.creator.toString() === currentUserId;
    const isModerator = community.moderators.some(
      (id: any) => id.toString() === currentUserId
    );

    if (!isCreator && !isModerator) {
      return ApiError.forbidden("You don't have permission to create roles in this community");
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = createRoleSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');

      return ApiError.badRequest("Validation error", { details: errorMessage });
    }

    const { name, color, permissions, position } = validationResult.data;

    // Check if a role with the same name already exists in this community
    const existingRole = await Role.findOne({
      community: sanitizedCommunityId,
      name,
    }).lean().exec();

    if (existingRole) {
      return ApiError.conflict("A role with this name already exists in this community");
    }

    // Create the new role
    const newRole = await Role.create({
      name,
      color,
      community: sanitizedCommunityId,
      position: position !== undefined ? position : 0,
      permissions: permissions || {},
      isDefault: false,
    });

    // Add the role to the community
    community.roles.push(newRole._id);
    await community.save();

    // Format the response
    const formattedRole = {
      id: newRole._id.toString(),
      name: newRole.name,
      color: newRole.color,
      position: newRole.position,
      isDefault: newRole.isDefault,
      permissions: newRole.permissions,
      createdAt: newRole.createdAt.toISOString(),
      updatedAt: newRole.updatedAt.toISOString(),
    };

    return NextResponse.json({ role: formattedRole }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/communities/[communityId]/roles] Error:", err);
    return ApiError.internalServerError("Failed to create role");
  }
}
