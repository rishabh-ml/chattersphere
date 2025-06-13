/**
 * Types for the profiles feature
 */

export interface SocialLink {
  platform: string;
  url: string;
}

export interface PrivacySettings {
  showEmail: boolean;
  showActivity: boolean;
  allowFollowers: boolean;
  allowMessages: boolean;
  isPrivate: boolean;
}

export interface User {
  id: string;
  clerkId: string;
  username: string;
  name: string;
  email: string;
  bio?: string;
  image?: string;
  pronouns?: string;
  location?: string;
  website?: string;
  socialLinks?: SocialLink[];
  interests?: string[];
  following: string[];
  followers: string[];
  communities: string[];
  savedPosts?: string[];
  privacySettings: PrivacySettings;
  followingCount: number;
  followerCount: number;
  communityCount: number;
  isFollowing: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserUpdateInput {
  name?: string;
  bio?: string;
  pronouns?: string;
  location?: string;
  website?: string;
  socialLinks?: SocialLink[];
  interests?: string[];
  privacySettings?: Partial<PrivacySettings>;
}

export interface ProfileQueryParams {
  includeFollowers?: boolean;
  includeFollowing?: boolean;
  includeSavedPosts?: boolean;
  includeCommunities?: boolean;
}

export interface PaginatedUsers {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
