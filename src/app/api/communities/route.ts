import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Community from '@/models/Community';

// Ensure database connection is established
let isConnected = false;

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to the database
    if (!isConnected) {
      await dbConnect();
      isConnected = true;
      console.log('[COMMUNITY POST] Connected to database');
    } else {
      console.log('[COMMUNITY POST] Using existing database connection');
    }

    // Parse request body
    const { name, description, image } = await req.json();
    console.log('[COMMUNITY POST] Creating community:', { name, description });

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Find the current user
    const currentUser = await User.findOne({ clerkId: userId });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if community with the same name already exists
    const existingCommunity = await Community.findOne({ name });

    if (existingCommunity) {
      return NextResponse.json(
        { error: 'A community with this name already exists' },
        { status: 409 }
      );
    }

    // Create the community
    const newCommunity = await Community.create({
      name,
      description,
      image,
      creator: currentUser._id,
      members: [currentUser._id],
      moderators: [currentUser._id],
      posts: []
    });

    // Add community to user's communities
    await User.findByIdAndUpdate(
      currentUser._id,
      { $push: { communities: newCommunity._id } }
    );

    console.log('[COMMUNITY POST] Community created successfully:', newCommunity._id.toString());

    return NextResponse.json({
      community: {
        id: newCommunity._id.toString(),
        name: newCommunity.name,
        description: newCommunity.description,
        image: newCommunity.image,
        creator: currentUser._id.toString(),
        memberCount: 1,
        postCount: 0,
        isMember: true,
        isModerator: true,
        isCreator: true,
        createdAt: newCommunity.createdAt.toISOString(),
        updatedAt: newCommunity.updatedAt.toISOString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[COMMUNITY POST] Error creating community:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // MongoDB duplicate key error
      if (error.message.includes('duplicate key') || error.message.includes('E11000')) {
        return NextResponse.json(
          { error: 'A community with this name already exists' },
          { status: 409 }
        );
      }

      // Validation error
      if (error.message.includes('validation failed')) {
        return NextResponse.json(
          { error: 'Invalid community data', details: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create community',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();

    // Connect to the database
    if (!isConnected) {
      await dbConnect();
      isConnected = true;
      console.log('[COMMUNITY GET] Connected to database');
    } else {
      console.log('[COMMUNITY GET] Using existing database connection');
    }

    // Get URL parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'members'; // members, posts, recent
    const skip = (page - 1) * limit;

    console.log('[COMMUNITY GET] Query parameters:', { page, limit, sort });

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'members':
        // Sort by member count (we'll do this in memory after fetching)
        break;
      case 'posts':
        // Sort by post count (we'll do this in memory after fetching)
        break;
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Get communities
    const communities = await Community.find()
      .sort(sortOptions)
      .populate('creator', 'username name image')
      .lean();

    // Apply custom sorting if needed
    if (sort === 'members') {
      communities.sort((a, b) => b.members.length - a.members.length);
    } else if (sort === 'posts') {
      communities.sort((a, b) => b.posts.length - a.posts.length);
    }

    // Apply pagination
    const paginatedCommunities = communities.slice(skip, skip + limit);

    // Transform communities to include virtual fields and user-specific data
    const transformedCommunities = await Promise.all(paginatedCommunities.map(async (community) => {
      const { _id, ...rest } = community;

      // Check if the current user is a member
      let isMember = false;
      let isModerator = false;

      if (userId) {
        const currentUser = await User.findOne({ clerkId: userId });
        if (currentUser) {
          isMember = community.members.some(id => id.toString() === currentUser._id.toString());
          isModerator = community.moderators.some(id => id.toString() === currentUser._id.toString());
        }
      }

      return {
        id: _id.toString(),
        ...rest,
        memberCount: community.members.length,
        postCount: community.posts.length,
        isMember,
        isModerator,
        isCreator: userId && community.creator && community.creator._id.toString() === community.creator._id.toString(),
        createdAt: community.createdAt.toISOString(),
        updatedAt: community.updatedAt.toISOString(),
      };
    }));

    console.log(`[COMMUNITY GET] Successfully fetched ${transformedCommunities.length} communities`);

    return NextResponse.json({
      communities: transformedCommunities,
      pagination: {
        page,
        limit,
        totalCommunities: communities.length,
        hasMore: communities.length > skip + limit
      },
      sort
    });
  } catch (error) {
    console.error('[COMMUNITY GET] Error fetching communities:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Cast to ObjectId failed')) {
        return NextResponse.json(
          { error: 'Invalid ID format' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch communities',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
