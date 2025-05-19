export interface Author {
  id: string;
  username: string;
  name: string;
  image?: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  content: string;
  author: Author;
  community: Community;
  createdAt: string;
  updatedAt: string;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  isSaved?: boolean;
  userRole?: string;
}
