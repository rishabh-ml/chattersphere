import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import connectToDatabase from '@/lib/DbConnect';
import User from '@/models/User';
import Post from '@/models/Post';

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
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

    // Parse request body
    const { voteType } = await req.json();

    // Validate vote type
    if (voteType !== 'upvote' && voteType !== 'downvote') {
      return NextResponse.json(
        { error: 'Invalid vote type' },
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

    // Find the post
    const post = await Post.findById(params.postId);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user has already voted
    const hasUpvoted = post.upvotes.includes(currentUser._id);
    const hasDownvoted = post.downvotes.includes(currentUser._id);

    // Update vote based on vote type and current state
    if (voteType === 'upvote') {
      if (hasUpvoted) {
        // Remove upvote if already upvoted (toggle off)
        post.upvotes = post.upvotes.filter(id => !id.equals(currentUser._id));
      } else {
        // Add upvote and remove downvote if exists
        post.upvotes.push(currentUser._id);
        post.downvotes = post.downvotes.filter(id => !id.equals(currentUser._id));
      }
    } else if (voteType === 'downvote') {
      if (hasDownvoted) {
        // Remove downvote if already downvoted (toggle off)
        post.downvotes = post.downvotes.filter(id => !id.equals(currentUser._id));
      } else {
        // Add downvote and remove upvote if exists
        post.downvotes.push(currentUser._id);
        post.upvotes = post.upvotes.filter(id => !id.equals(currentUser._id));
      }
    }

    // Save the updated post
    await post.save();

    // Return updated vote counts
    return NextResponse.json({
      upvoteCount: post.upvotes.length,
      downvoteCount: post.downvotes.length,
      voteCount: post.upvotes.length - post.downvotes.length,
      isUpvoted: post.upvotes.includes(currentUser._id),
      isDownvoted: post.downvotes.includes(currentUser._id)
    });
  } catch (error) {
    console.error('Error voting on post:', error);
    return NextResponse.json(
      { error: 'Failed to vote on post' },
      { status: 500 }
    );
  }
}
