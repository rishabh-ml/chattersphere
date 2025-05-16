// User types
export interface SocialLink {
  platform: string;
  url: string;
}

export interface PrivacySettings {
  showEmail: boolean;
  showActivity: boolean;
  allowFollowers: boolean;
  allowMessages: boolean;
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

// Post types
export interface Post {
  id: string;
  author: {
    _id: string;
    username: string;
    name: string;
    image?: string;
  };
  content: string;
  community?: {
    _id: string;
    name: string;
    image?: string;
  };
  upvoteCount: number;
  downvoteCount: number;
  voteCount: number;
  commentCount: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Comment types
export interface Comment {
  id: string;
  author: {
    _id: string;
    username: string;
    name: string;
    image?: string;
  };
  post: string;
  content: string;
  upvoteCount: number;
  downvoteCount: number;
  voteCount: number;
  parentComment?: string;
  createdAt: string;
  updatedAt: string;
}

// Community types
export interface Community {
  id: string;
  name: string;
  description: string;
  image?: string;
  creator: {
    _id: string;
    username: string;
    name: string;
    image?: string;
  };
  memberCount: number;
  postCount: number;
  isMember: boolean;
  isModerator: boolean;
  isCreator: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pagination types
export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  hasMore: boolean;
}
