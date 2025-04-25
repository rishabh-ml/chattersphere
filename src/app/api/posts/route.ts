import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Post from '@/models/Post';
import Community from '@/models/Community';

// Ensure database connection is established
let isConnected = false;

// Helper function to sanitize HTML content
function sanitizeHtml(html: string): string {
  if (!html) return '';

  // More comprehensive sanitization
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
    .replace(/javascript:[^\s"']+/g, '') // Remove javascript: URLs
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ''); // Remove style tags
}

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
      console.log('[POST] Connected to database');
    } else {
      console.log('[POST] Using existing database connection');
    }

    // Parse request body
    const body = await req.json();
    const { content, communityId } = body;
    console.log('Received post data:', { content, communityId });

    // Validate content
    if (!content || content.trim() === '') {
      console.log('[POST] Error: Empty content');
      return NextResponse.json(
        { error: 'Post content is required' },
        { status: 400 }
      );
    }

    // Check content length
    const MAX_CONTENT_LENGTH = 50000; // 50KB limit
    if (content.length > MAX_CONTENT_LENGTH) {
      console.log(`[POST] Error: Content too long (${content.length} chars)`);
      return NextResponse.json(
        { error: 'Post content is too long. Please keep it under 50,000 characters.' },
        { status: 400 }
      );
    }

    // Sanitize HTML content
    const sanitizedContent = sanitizeHtml(content);

    // Find the current user
    const currentUser = await User.findOne({ clerkId: userId });
    console.log('Found user:', currentUser ? currentUser._id : 'Not found');

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create post data
    const postData = {
      author: currentUser._id,
      content: sanitizedContent,
      upvotes: [],
      downvotes: [],
      comments: []
    };

    // If community is specified, validate and add to post
    if (communityId) {
      const community = await Community.findById(communityId);
      console.log('Found community:', community ? community._id : 'Not found');

      if (!community) {
        return NextResponse.json(
          { error: 'Community not found' },
          { status: 404 }
        );
      }

      // Check if user is a member of the community
      if (!community.members.includes(currentUser._id)) {
        return NextResponse.json(
          { error: 'You must be a member of the community to post' },
          { status: 403 }
        );
      }

      postData.community = community._id;
    }

    console.log('Creating post with data:', postData);
    // Create the post
    const newPost = await Post.create(postData);
    console.log('Created post:', newPost._id);

    // If post is in a community, update the community's posts array
    if (communityId) {
      await Community.findByIdAndUpdate(
        communityId,
        { $push: { posts: newPost._id } }
      );
      console.log('Updated community with new post');
    }

    // Populate author and community information
    await newPost.populate('author', 'username name image');
    if (communityId) {
      await newPost.populate('community', 'name image');
    }
    console.log('Populated post data');

    // Log the final post object
    console.log('[POST] Created post successfully:', {
      id: newPost._id.toString(),
      author: newPost.author._id,
      content: newPost.content.substring(0, 50) + (newPost.content.length > 50 ? '...' : ''),
      community: newPost.community ? newPost.community._id : 'none',
    });

    return NextResponse.json({
      post: {
        id: newPost._id.toString(),
        author: newPost.author,
        content: newPost.content,
        community: newPost.community,
        upvoteCount: 0,
        downvoteCount: 0,
        voteCount: 0,
        commentCount: 0,
        isUpvoted: false,
        isDownvoted: false,
        createdAt: newPost.createdAt.toISOString(),
        updatedAt: newPost.updatedAt.toISOString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[POST] Error creating post:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // MongoDB duplicate key error
      if (error.message.includes('duplicate key') || error.message.includes('E11000')) {
        return NextResponse.json(
          { error: 'A similar post already exists' },
          { status: 409 }
        );
      }

      // Validation error
      if (error.message.includes('validation failed')) {
        return NextResponse.json(
          { error: 'Invalid post data', details: error.message },
          { status: 400 }
        );
      }
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to create post',
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
      console.log('[GET] Connected to database');
    } else {
      console.log('[GET] Using existing database connection');
    }

    // Get URL parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const communityId = searchParams.get('communityId');
    const skip = (page - 1) * limit;

    console.log('[GET] Query parameters:', { page, limit, communityId });

    // Build query
    const query: Record<string, unknown> = {};

    // If communityId is provided, filter by community
    if (communityId) {
      query.community = communityId;
    }

    // Get posts
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name image')
      .populate('community', 'name image')
      .lean();

    // Get total count for pagination
    const totalPosts = await Post.countDocuments(query);

    // Calculate if there are more posts to load
    const hasMore = totalPosts > skip + posts.length;

    // Transform posts to include virtual fields and user-specific data
    const transformedPosts = await Promise.all(posts.map(async (post) => {
      const { _id, ...rest } = post;

      // Check if the current user has voted on this post
      let isUpvoted = false;
      let isDownvoted = false;

      if (userId) {
        const currentUser = await User.findOne({ clerkId: userId });
        if (currentUser) {
          isUpvoted = post.upvotes.some(id => id.toString() === currentUser._id.toString());
          isDownvoted = post.downvotes.some(id => id.toString() === currentUser._id.toString());
        }
      }

      return {
        id: _id.toString(),
        ...rest,
        upvoteCount: post.upvotes.length,
        downvoteCount: post.downvotes.length,
        voteCount: post.upvotes.length - post.downvotes.length,
        commentCount: post.comments.length,
        isUpvoted,
        isDownvoted,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    }));

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        totalPosts,
        hasMore
      }
    });

    console.log(`[GET] Successfully fetched ${transformedPosts.length} posts`);

  } catch (error) {
    console.error('[GET] Error fetching posts:', error);

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
        error: 'Failed to fetch posts',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
