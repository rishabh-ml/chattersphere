"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { Post } from "./PostContext";
import { toast } from "sonner";

// Define the feed types and sort options
export type FeedType = "following" | "joined" | "all";
export type SortOption = "new" | "top" | "trending";

// Define the context type
interface HomeFeedContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  feedType: FeedType;
  sortOption: SortOption;
  fetchPosts: (reset?: boolean) => Promise<void>;
  fetchMorePosts: () => Promise<void>;
  setFeedType: (type: FeedType) => void;
  setSortOption: (sort: SortOption) => void;
  votePost: (postId: string, voteType: "upvote" | "downvote") => Promise<void>;
  savePost: (postId: string) => Promise<boolean>;
}

// Create the context
const HomeFeedContext = createContext<HomeFeedContextType | undefined>(undefined);

// Create a provider component
export const HomeFeedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [feedType, setFeedTypeState] = useState<FeedType>("all");
  const [sortOption, setSortOptionState] = useState<SortOption>("new");

  // Set feed type function
  const setFeedType = useCallback((type: FeedType) => {
    setFeedTypeState(type);
    setPage(1); // Reset pagination when changing feed type
  }, []);

  // Set sort option function
  const setSortOption = useCallback((sort: SortOption) => {
    setSortOptionState(sort);
    setPage(1); // Reset pagination when changing sort option
  }, []);

  // Fetch posts function
  const fetchPosts = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        setError(null);

        const newPage = reset ? 1 : page;
        const response = await fetch(
          `/api/feed/home?page=${newPage}&limit=10&type=${feedType}&sort=${sortOption}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch home feed");
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
        console.error("[HomeFeedContext] Error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
      }
    },
    [page, feedType, sortOption]
  );

  // Fetch more posts function
  const fetchMorePosts = useCallback(() => {
    if (!loading && hasMore) {
      return fetchPosts(false);
    }
    return Promise.resolve();
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
        console.error("Error voting on post:", err);
        // We don't set the error state here to avoid disrupting the UI for a non-critical action
      }
    },
    [setPosts]
  );

  // Save/unsave post function
  const savePost = useCallback(
    async (postId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/posts/${postId}/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to save/unsave post");
        }

        const data = await response.json();

        // Update the post in the posts array
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                isSaved: data.isSaved,
              };
            }
            return post;
          })
        );

        return data.isSaved;
      } catch (err) {
        console.error("Error saving post:", err);
        toast.error("Failed to update saved status");
        return false;
      }
    },
    [setPosts]
  );

  // Effect to fetch posts when feed type or sort option changes
  useEffect(() => {
    fetchPosts(true);
  }, [feedType, sortOption, fetchPosts]);

  const value = {
    posts,
    loading,
    error,
    hasMore,
    page,
    feedType,
    sortOption,
    fetchPosts,
    fetchMorePosts,
    setFeedType,
    setSortOption,
    votePost,
    savePost,
  };

  return <HomeFeedContext.Provider value={value}>{children}</HomeFeedContext.Provider>;
};

// Create a hook to use the context
export const useHomeFeed = () => {
  const context = useContext(HomeFeedContext);
  if (context === undefined) {
    throw new Error("useHomeFeed must be used within a HomeFeedProvider");
  }
  return context;
};
