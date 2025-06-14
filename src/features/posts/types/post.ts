/**
 * Types for the posts feature
 */

export interface Post {
  id: string;
  author: {
    id: string;
    username: string;
    name: string;
    image?: string;
  };
  content: string;
  community?: {
    id: string;
    name: string;
    slug: string;
    image?: string;
  };
  upvoteCount: number;
  downvoteCount: number;
  voteCount: number;
  commentCount: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  isSaved: boolean;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PostCreateInput {
  content: string;
  communityId?: string;
  mediaUrls?: string[];
}

export interface PostsQueryParams {
  page?: number;
  limit?: number;
  sort?: "newest" | "popular" | "controversial" | "oldest";
  communityId?: string;
  userId?: string;
}

export interface PaginatedPosts {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
