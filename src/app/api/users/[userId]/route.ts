import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import connectToDatabase from '@/lib/DbConnect';
import User from '@/models/User';
import Post from '@/models/Post';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: clerkUserId } = auth();

    // Connect to the database
    await connectToDatabase();

    // Find the target user
    const user = await User.findById(params.userId)
      .populate('communities', 'name image')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's posts
    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('community', 'name image')
      .lean();

    // Check if the current user is following this user
    let isFollowing = false;
    if (clerkUserId) {
      const currentUser = await User.findOne({ clerkId: clerkUserId });
      if (currentUser) {
        isFollowing = currentUser.following.some(id => id.toString() === user._id.toString());
      }
    }

    // Transform user data
    const { _id, ...userData } = user;

    return NextResponse.json({
      user: {
        id: _id.toString(),
        ...userData,
        followingCount: user.following.length,
        followerCount: user.followers.length,
        communityCount: user.communities.length,
        isFollowing,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      recentPosts: posts.map(post => {
        const { _id, ...postData } = post;
        return {
          id: _id.toString(),
          ...postData,
          upvoteCount: post.upvotes.length,
          downvoteCount: post.downvotes.length,
          voteCount: post.upvotes.length - post.downvotes.length,
          commentCount: post.comments.length,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        };
      })
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
