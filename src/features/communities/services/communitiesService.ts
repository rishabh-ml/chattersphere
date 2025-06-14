/**
 * Communities API service
 * Handles all API interactions related to communities
 */
import { ApiClient } from "@/shared/services/apiClient";
import {
  Community,
  CommunityCreateInput,
  CommunityUpdateInput,
  CommunityMember,
  PaginatedCommunities,
  CommunitiesQueryParams,
} from "../types";

/**
 * Fetch communities with pagination and filters
 */
export async function getCommunities(
  options: CommunitiesQueryParams = {}
): Promise<PaginatedCommunities> {
  const { page = 1, limit = 10, sort = "popular", query } = options;

  // Build query parameters
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  params.append("sort", sort);

  if (query) {
    params.append("query", query);
  }

  return ApiClient.get<PaginatedCommunities>(`/api/communities?${params.toString()}`);
}

/**
 * Fetch a single community by slug
 */
export async function getCommunity(slug: string): Promise<{ community: Community }> {
  return ApiClient.get<{ community: Community }>(`/api/communities/${slug}`);
}

/**
 * Create a new community
 */
export async function createCommunity(
  data: CommunityCreateInput
): Promise<{ community: Community }> {
  return ApiClient.post<{ community: Community }>("/api/communities", data);
}

/**
 * Update a community
 */
export async function updateCommunity(
  slug: string,
  data: CommunityUpdateInput
): Promise<{ community: Community }> {
  return ApiClient.patch<{ community: Community }>(`/api/communities/${slug}`, data);
}

/**
 * Delete a community
 */
export async function deleteCommunity(slug: string): Promise<{ success: boolean }> {
  return ApiClient.delete<{ success: boolean }>(`/api/communities/${slug}`);
}

/**
 * Join a community
 */
export async function joinCommunity(
  slug: string
): Promise<{ success: boolean; isPending?: boolean }> {
  return ApiClient.post<{ success: boolean; isPending?: boolean }>(
    `/api/communities/${slug}/join`,
    {}
  );
}

/**
 * Leave a community
 */
export async function leaveCommunity(slug: string): Promise<{ success: boolean }> {
  return ApiClient.delete<{ success: boolean }>(`/api/communities/${slug}/membership`);
}

/**
 * Get community members
 */
export async function getCommunityMembers(
  slug: string,
  options: { page?: number; limit?: number; role?: string } = {}
): Promise<{
  members: CommunityMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const { page = 1, limit = 20, role } = options;

  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  if (role) {
    params.append("role", role);
  }

  return ApiClient.get(`/api/communities/${slug}/members?${params.toString()}`);
}

/**
 * Update member role
 */
export async function updateMemberRole(
  slug: string,
  userId: string,
  role: string
): Promise<{ success: boolean }> {
  return ApiClient.patch<{ success: boolean }>(`/api/communities/${slug}/members/${userId}`, {
    role,
  });
}

/**
 * Remove member from community
 */
export async function removeMember(slug: string, userId: string): Promise<{ success: boolean }> {
  return ApiClient.delete<{ success: boolean }>(`/api/communities/${slug}/members/${userId}`);
}

/**
 * Get pending join requests
 */
export async function getPendingRequests(
  slug: string,
  options: { page?: number; limit?: number } = {}
): Promise<{
  requests: { id: string; user: any; requestedAt: string }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const { page = 1, limit = 20 } = options;

  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  return ApiClient.get(`/api/communities/${slug}/requests?${params.toString()}`);
}

/**
 * Approve a join request
 */
export async function approveJoinRequest(
  slug: string,
  userId: string
): Promise<{ success: boolean }> {
  return ApiClient.post<{ success: boolean }>(
    `/api/communities/${slug}/requests/${userId}/approve`,
    {}
  );
}

/**
 * Reject a join request
 */
export async function rejectJoinRequest(
  slug: string,
  userId: string
): Promise<{ success: boolean }> {
  return ApiClient.post<{ success: boolean }>(
    `/api/communities/${slug}/requests/${userId}/reject`,
    {}
  );
}
