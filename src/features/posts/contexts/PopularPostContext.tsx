"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Post } from "./PostContext";

// Define the context type
interface PopularPostContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  timeRange: "day" | "week" | "month" | "all";
  fetchPosts: (reset?: boolean) => Promise<void>;
  fetchMorePosts: () => Promise<void>;
  setTimeRange: (range: "day" | "week" | "month" | "all") => void;
  votePost: (postId: string, voteType: "upvote" | "downvote") => Promise<void>;
}

// Create the context
const PopularPostContext = createContext<PopularPostContextType | undefined>(undefined);

// Create a provider component
export const PopularPostProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [timeRange, setTimeRangeState] = useState<"day" | "week" | "month" | "all">("day");

  // Set time range function
  const setTimeRange = useCallback(
    (range: "day" | "week" | "month" | "all") => {
      setTimeRangeState(range);
      // We'll call fetchPosts in a useEffect
    },
    [setTimeRangeState]
  );

  // Fetch posts function
  const fetchPosts = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        setError(null);

        const newPage = reset ? 1 : page;
        const response = await fetch(
          `/api/posts/popular?page=${newPage}&limit=10&timeRange=${timeRange}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch popular posts");
        }

        const data = await response.json();

        if (reset) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }

        setHasMore(data.pagination.hasMore);
        setPage(reset ? 2 : page + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [page, timeRange, setLoading, setError, setPosts, setHasMore, setPage]
  );

  // Fetch more posts function
  const fetchMorePosts = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchPosts();
    }
  }, [fetchPosts, loading, hasMore]);

  // Vote on post function
  const votePost = useCallback(
    async (postId: string, voteType: "upvote" | "downvote") => {
      try {
        const response = await fetch(`/api/posts/${postId}/vote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ voteType }),
        });

        if (!response.ok) {
          throw new Error("Failed to vote on post");
        }

        const data = await response.json();

        // Update the post in the posts array
        setPosts((prev) =>
          prev.map((post) => {
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
          })
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    },
    [setPosts, setError]
  );

  // Initial fetch
  React.useEffect(() => {
    fetchPosts(true);
  }, [timeRange, fetchPosts]);

  const value = {
    posts,
    loading,
    error,
    hasMore,
    page,
    timeRange,
    fetchPosts,
    fetchMorePosts,
    setTimeRange,
    votePost,
  };

  return <PopularPostContext.Provider value={value}>{children}</PopularPostContext.Provider>;
};

// Create a hook to use the context
export const usePopularPosts = () => {
  const context = useContext(PopularPostContext);
  if (context === undefined) {
    throw new Error("usePopularPosts must be used within a PopularPostProvider");
  }
  return context;
};
