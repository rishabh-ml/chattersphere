/**
 * Types for the communities feature
 */

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  isPrivate: boolean;
  creator: string;
  memberCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
  isMember: boolean;
  isPending: boolean;
  isCreator: boolean;
  isModerator: boolean;
}

export interface CommunityCreateInput {
  name: string;
  description?: string;
  isPrivate?: boolean;
  image?: string;
  bannerImage?: string;
}

export interface CommunityUpdateInput {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  image?: string;
  bannerImage?: string;
}

export interface CommunityMember {
  id: string;
  user: {
    id: string;
    username: string;
    name: string;
    image?: string;
  };
  role: "ADMIN" | "MODERATOR" | "MEMBER";
  joinedAt: string;
}

export type MemberRole = "ADMIN" | "MODERATOR" | "MEMBER";

export interface CommunitiesQueryParams {
  page?: number;
  limit?: number;
  sort?: "newest" | "popular" | "alphabetical";
  query?: string;
}

export interface PaginatedCommunities {
  communities: Community[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
