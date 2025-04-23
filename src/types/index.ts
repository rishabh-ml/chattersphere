// Define common types used throughout the application

export interface Post {
  _id: string;
  authorName: string;
  content: string;
  createdAt: string;
  title?: string;
  community?: string;
  upvotes?: number;
  comments?: number;
  saved?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  members: number;
  icon: string;
}
