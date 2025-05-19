import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/dbConnect";
import User from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import Community from "@/models/Community";
import mongoose from "mongoose";
import { sanitizeInput } from "@/lib/security";

// Helper function to validate user access and get user data
async function validateUserAccess(params: { userId: string }, clerkUserId: string | null) {
  // Sanitize and validate userId
  if (!params?.userId) {
    return { error: { message: "Missing userId parameter", status: 400 } };
  }

  const sanitizedUserId = sanitizeInput(params.userId);

  if (!mongoose.Types.ObjectId.isValid(sanitizedUserId)) {
    return { error: { message: "Invalid userId format", status: 400 } };
  }

  await connectToDatabase();

  // Find the user
  const user = await User.findById(sanitizedUserId).lean().exec();

  if (!user) {
    return { error: { message: "User not found", status: 404 } };
  }

  // Check if the requesting user has permission to view activity
  const isOwner = clerkUserId && user.clerkId === clerkUserId;
  const canViewActivity = isOwner || user.privacySettings?.showActivity !== false;

  if (!canViewActivity) {
    return { error: { message: "This user's activity is private", status: 403 } };
  }

  return { user, sanitizedUserId };
}

// Helper function to get pagination parameters
function getPaginationParams(req: NextRequest) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");

  // Validate pagination parameters
  const validPage = Math.max(1, page);
  const validLimit = Math.min(50, Math.max(1, limit));
  const skip = (validPage - 1) * validLimit;

  return { page: validPage, limit: validLimit, skip };
}

// GET /api/profile/[userId]/activity - Get user activity (posts, comments, and communities)
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    // Validate user access
    const validation = await validateUserAccess(params, clerkUserId);
    if (validation.error) {
      return NextResponse.json({ error: validation.error.message }, { status: validation.error.status });
    }

    const { user } = validation;

    // Get pagination parameters
    const { page, limit, skip } = getPaginationParams(req);

    // Get the type of activity to fetch
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "all"; // "all", "posts", "comments", "communities"

    // Get the current user for determining upvote/downvote status
    let currentUser = null;
    if (clerkUserId) {
      currentUser = await User.findOne({ clerkId: clerkUserId }).lean().exec();
    }

    // Prepare response object
    const response: {
      posts?: any[];
      comments?: any[];
      communities?: any[];
      pagination: {
        page: number;
        limit: number;
        totalItems: number;
        hasMore: boolean;
      };
    } = {
      pagination: {
        page,
        limit,
        totalItems: 0,
        hasMore: false,
      },
    };

    // Use Promise.all to fetch all requested data in parallel
    const promises = [];

    // Fetch posts if requested
    if (type === "all" || type === "posts") {
      promises.push(
        (async () => {
          // Use aggregation pipeline for more efficient querying
          const postsAggregation = [
            { $match: { author: user._id } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            // Add computed fields for counts
            { $addFields: {
                upvoteCount: { $size: { $ifNull: ["$upvotes", []] } },
                downvoteCount: { $size: { $ifNull: ["$downvotes", []] } },
                commentCount: { $size: { $ifNull: ["$comments", []] } },
            }},
            // Lookup author information
            { $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "authorInfo"
            }},
            { $unwind: "$authorInfo" },
            // Lookup community information if present
            { $lookup: {
                from: "communities",
                localField: "community",
                foreignField: "_id",
                as: "communityInfo"
            }},
            { $unwind: { path: "$communityInfo", preserveNullAndEmptyArrays: true } },
          ];

          const countPipeline = [{ $match: { author: user._id } }, { $count: "total" }];

          const [posts, countResult] = await Promise.all([
            Post.aggregate(postsAggregation),
            Post.aggregate(countPipeline)
          ]);

          const postsCount = countResult.length > 0 ? countResult[0].total : 0;

          response.posts = posts.map(post => ({
            id: post._id.toString(),
            content: post.content,
            author: {
              _id: post.authorInfo._id.toString(),
              username: post.authorInfo.username,
              name: post.authorInfo.name,
              image: post.authorInfo.image,
            },
            community: post.communityInfo ? {
              _id: post.communityInfo._id.toString(),
              name: post.communityInfo.name,
              image: post.communityInfo.image,
            } : undefined,
            upvoteCount: post.upvoteCount,
            downvoteCount: post.downvoteCount,
            voteCount: post.upvoteCount - post.downvoteCount,
            commentCount: post.commentCount,
            isUpvoted: currentUser ? post.upvotes?.some(id => id.toString() === currentUser._id.toString()) || false : false,
            isDownvoted: currentUser ? post.downvotes?.some(id => id.toString() === currentUser._id.toString()) || false : false,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
          }));

          if (type === "posts") {
            response.pagination.totalItems = postsCount;
            response.pagination.hasMore = skip + posts.length < postsCount;
          } else {
            response.pagination.totalItems += postsCount;
          }
        })()
      );
    }

    // Fetch comments if requested
    if (type === "all" || type === "comments") {
      promises.push(
        (async () => {
          // Use aggregation pipeline for more efficient querying
          const commentsAggregation = [
            { $match: { author: user._id } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            // Add computed fields for counts
            { $addFields: {
                upvoteCount: { $size: { $ifNull: ["$upvotes", []] } },
                downvoteCount: { $size: { $ifNull: ["$downvotes", []] } },
            }},
            // Lookup author information
            { $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "authorInfo"
            }},
            { $unwind: "$authorInfo" },
            // Lookup post information
            { $lookup: {
                from: "posts",
                localField: "post",
                foreignField: "_id",
                as: "postInfo"
            }},
            { $unwind: "$postInfo" },
          ];

          const countPipeline = [{ $match: { author: user._id } }, { $count: "total" }];

          const [comments, countResult] = await Promise.all([
            Comment.aggregate(commentsAggregation),
            Comment.aggregate(countPipeline)
          ]);

          const commentsCount = countResult.length > 0 ? countResult[0].total : 0;

          response.comments = comments.map(comment => ({
            id: comment._id.toString(),
            content: comment.content,
            author: {
              _id: comment.authorInfo._id.toString(),
              username: comment.authorInfo.username,
              name: comment.authorInfo.name,
              image: comment.authorInfo.image,
            },
            post: {
              _id: comment.postInfo._id.toString(),
              content: comment.postInfo.content.substring(0, 100) + (comment.postInfo.content.length > 100 ? '...' : ''),
            },
            upvoteCount: comment.upvoteCount,
            downvoteCount: comment.downvoteCount,
            voteCount: comment.upvoteCount - comment.downvoteCount,
            isUpvoted: currentUser ? comment.upvotes?.some(id => id.toString() === currentUser._id.toString()) || false : false,
            isDownvoted: currentUser ? comment.downvotes?.some(id => id.toString() === currentUser._id.toString()) || false : false,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString(),
          }));

          if (type === "comments") {
            response.pagination.totalItems = commentsCount;
            response.pagination.hasMore = skip + comments.length < commentsCount;
          } else {
            response.pagination.totalItems += commentsCount;
          }
        })()
      );
    }

    // Fetch communities if requested
    if (type === "all" || type === "communities") {
      promises.push(
        (async () => {
          // Use aggregation pipeline for more efficient querying
          const communitiesAggregation = [
            { $match: { members: user._id } },
            { $sort: { name: 1 } },
            { $skip: skip },
            { $limit: limit },
            // Add computed fields for counts
            { $addFields: {
                memberCount: { $size: { $ifNull: ["$members", []] } },
                postCount: { $size: { $ifNull: ["$posts", []] } },
                channelCount: { $size: { $ifNull: ["$channels", []] } },
            }},
          ];

          const countPipeline = [{ $match: { members: user._id } }, { $count: "total" }];

          const [communities, countResult] = await Promise.all([
            Community.aggregate(communitiesAggregation),
            Community.aggregate(countPipeline)
          ]);

          const communitiesCount = countResult.length > 0 ? countResult[0].total : 0;

          response.communities = communities.map(community => {
            // Find when the user joined this community (if available)
            const membership = community.membershipDates?.find(
              m => m.user.toString() === user._id.toString()
            );

            return {
              id: community._id.toString(),
              name: community.name,
              slug: community.slug,
              description: community.description,
              image: community.image,
              banner: community.banner,
              isPrivate: community.isPrivate,
              memberCount: community.memberCount,
              postCount: community.postCount,
              channelCount: community.channelCount,
              joinedAt: membership?.joinedAt ? membership.joinedAt.toISOString() : null,
              createdAt: community.createdAt.toISOString(),
              updatedAt: community.updatedAt.toISOString(),
            };
          });

          if (type === "communities") {
            response.pagination.totalItems = communitiesCount;
            response.pagination.hasMore = skip + communities.length < communitiesCount;
          } else if (type === "all") {
            response.pagination.totalItems += communitiesCount;
          }
        })()
      );
    }

    // Wait for all promises to resolve
    await Promise.all(promises);

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[GET /api/profile/[userId]/activity] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user activity" },
      { status: 500 }
    );
  }
}
