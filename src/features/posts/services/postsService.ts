/**
 * Posts API service
 * Handles all API interactions related to posts
 */

import { ApiClient } from "@/shared/services/apiClient";
import { Post, PaginatedPosts, PostsQueryParams } from "../types/post";

/**
 * Fetch posts with pagination and filters
 */
export async function getPosts(options: PostsQueryParams): Promise<PaginatedPosts> {
  const { page = 1, limit = 10, sort = "newest", communityId, userId } = options;

  // Build query parameters
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  params.append("sort", sort);

  if (communityId) {
    params.append("communityId", communityId);
  }

  if (userId) {
    params.append("userId", userId);
  }

  // Make the API call using our shared client
  return ApiClient.get<PaginatedPosts>(`/api/posts?${params.toString()}`);
}

/**
 * Fetch a single post by ID
 */
export async function getPost(postId: string): Promise<{ post: Post }> {
  return ApiClient.get<{ post: Post }>(`/api/posts/${postId}`);
}

/**
 * Create a new post
 */
export async function createPost(data: {
  content: string;
  communityId?: string;
  mediaUrls?: string[];
}): Promise<{ post: Post }> {
  return ApiClient.post<{ post: Post }>("/api/posts", data);
}

/**
 * Delete a post
 */
export async function deletePost(postId: string): Promise<{ success: boolean }> {
  return ApiClient.delete<{ success: boolean }>(`/api/posts/${postId}`);
}

/**
 * Upvote a post
 */
export async function upvotePost(postId: string): Promise<{ success: boolean }> {
  return ApiClient.post<{ success: boolean }>(`/api/posts/${postId}/vote`, { action: "upvote" });
}

/**
 * Downvote a post
 */
export async function downvotePost(postId: string): Promise<{ success: boolean }> {
  return ApiClient.post<{ success: boolean }>(`/api/posts/${postId}/vote`, { action: "downvote" });
}

/**
 * Save a post
 */
export async function savePost(postId: string): Promise<{ success: boolean }> {
  return ApiClient.post<{ success: boolean }>(`/api/posts/${postId}/save`, {});
}

/**
 * Unsave a post
 */
export async function unsavePost(postId: string): Promise<{ success: boolean }> {
  return ApiClient.delete<{ success: boolean }>(`/api/posts/${postId}/save`);
}
