/**
 * Profiles API service
 * Handles all API interactions related to user profiles
 */
import { ApiClient } from "@/shared/services/apiClient";
import { User, ProfileQueryParams, PaginatedUsers, UserUpdateInput } from "../types";

/**
 * Get the current user's profile
 */
export async function getCurrentUser(): Promise<{ user: User }> {
  return ApiClient.get<{ user: User }>("/api/users/me");
}

/**
 * Get a user's profile by username
 */
export async function getUserProfile(
  username: string,
  options: ProfileQueryParams = {}
): Promise<{ user: User }> {
  const params = new URLSearchParams();

  if (options.includeFollowers) {
    params.append("includeFollowers", "true");
  }

  if (options.includeFollowing) {
    params.append("includeFollowing", "true");
  }

  if (options.includeSavedPosts) {
    params.append("includeSavedPosts", "true");
  }

  if (options.includeCommunities) {
    params.append("includeCommunities", "true");
  }

  const queryString = params.toString();
  const url = queryString ? `/api/profile/${username}?${queryString}` : `/api/profile/${username}`;

  return ApiClient.get<{ user: User }>(url);
}

/**
 * Update the current user's profile
 */
export async function updateProfile(data: UserUpdateInput): Promise<{ user: User }> {
  return ApiClient.patch<{ user: User }>("/api/users/me", data);
}

/**
 * Follow a user
 */
export async function followUser(username: string): Promise<{ success: boolean }> {
  return ApiClient.post<{ success: boolean }>(`/api/profile/${username}/follow`, {});
}

/**
 * Unfollow a user
 */
export async function unfollowUser(username: string): Promise<{ success: boolean }> {
  return ApiClient.delete<{ success: boolean }>(`/api/profile/${username}/follow`);
}

/**
 * Get a user's followers
 */
export async function getUserFollowers(
  username: string,
  options: { page?: number; limit?: number } = {}
): Promise<PaginatedUsers> {
  const { page = 1, limit = 20 } = options;

  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  return ApiClient.get<PaginatedUsers>(`/api/profile/${username}/followers?${params.toString()}`);
}

/**
 * Get users following a user
 */
export async function getUserFollowing(
  username: string,
  options: { page?: number; limit?: number } = {}
): Promise<PaginatedUsers> {
  const { page = 1, limit = 20 } = options;

  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  return ApiClient.get<PaginatedUsers>(`/api/profile/${username}/following?${params.toString()}`);
}
