import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import connectToDatabase from '@/lib/DbConnect';
import User from '@/models/User';
import Post from '@/models/Post';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get URL parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Find the current user to get their following list
    const currentUser = await User.findOne({ clerkId: userId });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get posts from users that the current user follows
    const posts = await Post.find({
      author: { $in: currentUser.following }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name image')
      .populate('community', 'name image')
      .lean();

    // Get total count for pagination
    const totalPosts = await Post.countDocuments({
      author: { $in: currentUser.following }
    });

    // Calculate if there are more posts to load
    const hasMore = totalPosts > skip + posts.length;

    // Transform posts to include virtual fields
    const transformedPosts = posts.map(post => {
      const { _id, ...rest } = post;
      return {
        id: _id.toString(),
        ...rest,
        upvoteCount: post.upvotes.length,
        downvoteCount: post.downvotes.length,
        voteCount: post.upvotes.length - post.downvotes.length,
        commentCount: post.comments.length,
        isUpvoted: post.upvotes.some(id => id.toString() === currentUser._id.toString()),
        isDownvoted: post.downvotes.some(id => id.toString() === currentUser._id.toString()),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        totalPosts,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching home feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch home feed' },
      { status: 500 }
    );
  }
}
