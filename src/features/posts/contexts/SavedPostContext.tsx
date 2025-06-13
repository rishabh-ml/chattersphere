"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Post } from './PostContext';
import { toast } from 'sonner';

// Define the context type
interface SavedPostContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  fetchPosts: (reset?: boolean) => Promise<void>;
  fetchMorePosts: () => Promise<void>;
  savePost: (postId: string) => Promise<boolean>;
  votePost: (postId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
}

// Create the context
const SavedPostContext = createContext<SavedPostContextType | undefined>(undefined);

// Create a provider component
export const SavedPostProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  // Fetch saved posts function
  const fetchPosts = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const newPage = reset ? 1 : page;
      const response = await fetch(`/api/posts/saved?page=${newPage}&limit=10`);

      if (!response.ok) {
        throw new Error('Failed to fetch saved posts');
      }

      const data = await response.json();

      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }

      setHasMore(data.pagination.hasMore);
      setPage(reset ? 2 : page + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, setLoading, setError, setPosts, setHasMore, setPage]);

  // Fetch more posts function
  const fetchMorePosts = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchPosts();
    }
  }, [fetchPosts, loading, hasMore]);

  // Save/unsave post function
  const savePost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to save/unsave post');
      }

      const data = await response.json();
      
      // If we're unsaving a post, remove it from the list
      if (!data.isSaved) {
        setPosts(prev => prev.filter(post => post.id !== postId));
        toast.success('Post removed from saved items');
      }

      return data.isSaved;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to update saved status');
      return false;
    }
  }, [setPosts, setError]);

  // Vote post function
  const votePost = useCallback(async (postId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote on post');
      }

      const data = await response.json();

      // Update the post in the posts array
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            upvoteCount: data.upvoteCount,
            downvoteCount: data.downvoteCount,
            voteCount: data.voteCount,
            isUpvoted: data.isUpvoted,
            isDownvoted: data.isDownvoted,
          };
        }
        return post;
      }));
    } catch (err) {
      console.error('Error voting on post:', err);
      // We don't set the error state here to avoid disrupting the UI for a non-critical action
    }
  }, [setPosts]);

  // Effect to fetch posts on initial load
  useEffect(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  const value = {
    posts,
    loading,
    error,
    hasMore,
    page,
    fetchPosts,
    fetchMorePosts,
    savePost,
    votePost,
  };

  return <SavedPostContext.Provider value={value}>{children}</SavedPostContext.Provider>;
};

// Create a hook to use the context
export const useSavedPosts = () => {
  const context = useContext(SavedPostContext);
  if (context === undefined) {
    throw new Error('useSavedPosts must be used within a SavedPostProvider');
  }
  return context;
};
