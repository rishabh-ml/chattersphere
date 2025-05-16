// Define common types used throughout the application

// Import the Post type from PostContext to ensure consistency
import { Post as PostContextType } from '@/context/PostContext';

// Re-export the Post type from PostContext
export type Post = PostContextType;

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
