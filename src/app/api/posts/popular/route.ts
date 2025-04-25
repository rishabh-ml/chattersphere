import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Post from '@/models/Post';
import mongoose from 'mongoose';

// Ensure database connection is established
let isConnected = false;

const DECAY_FACTOR = 45000; // ~12.5 hours half-life
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
interface CachedPost {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; username: string; name: string; image?: string };
  content: string;
  community?: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name: string; image?: string };
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  score?: number;
}

let cachedPosts: { posts: CachedPost[]; cacheKey: string } | null = null;
let lastCacheTime = 0;

function calculateScore(upvotes: number, downvotes: number, createdAt: Date): number {
  const voteScore = upvotes - downvotes;
  const ageInMs = Date.now() - createdAt.getTime();
  return voteScore / Math.pow(1 + ageInMs / DECAY_FACTOR, 1.5);
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();

    // Connect to the database
    if (!isConnected) {
      await dbConnect();
      isConnected = true;
      console.log('[POPULAR] Connected to database');
    } else {
      console.log('[POPULAR] Using existing database connection');
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const timeRange = searchParams.get('timeRange') || 'day';
    const skip = (page - 1) * limit;

    console.log('[POPULAR] Query parameters:', { page, limit, timeRange });

    let timeThreshold = new Date();
    switch (timeRange) {
      case 'day':
        timeThreshold.setDate(timeThreshold.getDate() - 1);
        break;
      case 'week':
        timeThreshold.setDate(timeThreshold.getDate() - 7);
        break;
      case 'month':
        timeThreshold.setMonth(timeThreshold.getMonth() - 1);
        break;
      case 'all':
        timeThreshold = new Date(0);
        break;
      default:
        timeThreshold.setDate(timeThreshold.getDate() - 1);
    }

    const now = Date.now();
    const cacheKey = `${timeRange}-${page}-${limit}`;
    const shouldUseCache =
      cachedPosts !== null &&
      cachedPosts.cacheKey === cacheKey &&
      (now - lastCacheTime) < CACHE_TTL &&
      page === 1;

    let posts;

    if (shouldUseCache) {
      console.log('[POPULAR] Using cached posts');
      posts = cachedPosts.posts;
    } else {
      console.log('[POPULAR] Fetching fresh posts');
      posts = await Post.find({
        createdAt: { $gte: timeThreshold }
      })
        .populate('author', 'username name image')
        .populate('community', 'name image')
        .lean();

      if (page === 1) {
        cachedPosts = {
          posts,
          cacheKey
        };
        lastCacheTime = now;
      }
    }

    const scoredPosts = posts.map((post: CachedPost) => ({
      ...post,
      score: calculateScore(post.upvotes.length, post.downvotes.length, post.createdAt)
    }));

    scoredPosts.sort((a: CachedPost, b: CachedPost) => (b.score || 0) - (a.score || 0));

    const paginatedPosts = scoredPosts.slice(skip, skip + limit);

    const transformedPosts = await Promise.all(paginatedPosts.map(async (post: CachedPost) => {
      const { _id, score, ...rest } = post;

      let isUpvoted = false;
      let isDownvoted = false;

      if (userId) {
        const currentUser = await User.findOne({ clerkId: userId });
        if (currentUser) {
          isUpvoted = post.upvotes.some((id: mongoose.Types.ObjectId) => id.toString() === currentUser._id.toString());
          isDownvoted = post.downvotes.some((id: mongoose.Types.ObjectId) => id.toString() === currentUser._id.toString());
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
        popularityScore: score.toFixed(2)
      };
    }));

    console.log(`[POPULAR] Successfully fetched ${transformedPosts.length} popular posts`);

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        totalPosts: posts.length,
        hasMore: posts.length > skip + limit
      },
      timeRange
    });
  } catch (error) {
    console.error('[POPULAR] Error fetching popular posts:', error);

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
        error: 'Failed to fetch popular posts',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}