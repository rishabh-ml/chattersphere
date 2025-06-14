// src/context/PostContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

// Function to generate mock posts on the client side as a last resort fallback
function generateClientSideMockPosts(count = 10) {
  const posts = [];

  for (let i = 0; i < count; i++) {
    const id = `mock_${Date.now()}_${i}`;
    const createdAt = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));

    posts.push({
      id,
      author: {
        id: `author_${i}`,
        name: `User ${i}`,
        username: `user${i}`,
        image: `https://placehold.co/100x100?text=U${i}`,
      },
      content: `<p>This is a mock post #${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>`,
      community:
        i % 3 === 0
          ? {
              id: `community_${i % 5}`,
              name: `Community ${i % 5}`,
              slug: `community-${i % 5}`,
              image: `https://placehold.co/100x100?text=C${i % 5}`,
            }
          : undefined,
      upvoteCount: Math.floor(Math.random() * 100),
      downvoteCount: Math.floor(Math.random() * 20),
      voteCount: Math.floor(Math.random() * 80),
      commentCount: Math.floor(Math.random() * 50),
      isUpvoted: Math.random() > 0.5,
      isDownvoted: Math.random() > 0.8,
      isSaved: Math.random() > 0.7,
      mediaUrls: i % 4 === 0 ? [`https://placehold.co/600x400?text=Post+Image+${i}`] : [],
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  }

  return posts;
}

export interface Post {
  id: string;
  author: {
    id: string;
    username: string;
    name: string;
    image?: string;
  };
  content: string;
  community?: {
    id: string;
    name: string;
    slug: string;
    image?: string;
  };
  upvoteCount: number;
  downvoteCount: number;
  voteCount: number;
  commentCount: number;
  mediaUrls?: string[];
  isUpvoted: boolean;
  isDownvoted: boolean;
  isSaved?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PostContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  fetchMorePosts: () => Promise<void>;
  createPost: (content: string, communityId?: string, mediaUrls?: string[]) => Promise<Post | null>;
  votePost: (postId: string, voteType: "upvote" | "downvote") => Promise<void>;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(
    async (reset = false) => {
      if (!reset && loading) return;
      setLoading(true);
      try {
        const nextPage = reset ? 1 : page;
        console.log(`[PostContext] Fetching posts: page=${nextPage}, limit=10`);

        // Try the main feed endpoint first
        let fetchResult;
        try {
          const res = await fetch(`/api/posts/feed?page=${nextPage}&limit=10`);

          if (!res.ok) {
            let errorMessage = `Fetch failed (${res.status})`;
            let errorDetails = "";

            try {
              // Try to parse as JSON
              const errorData = await res.json();
              if (errorData && errorData.error) {
                errorMessage = errorData.error;
                errorDetails = errorData.details ? `: ${errorData.details}` : "";
              }
            } catch (parseError) {
              // If not JSON, try to get text
              try {
                const textContent = await res.text();
                errorDetails = `: Response was not JSON (${textContent.substring(0, 50)}...)`;
              } catch (textError) {
                errorDetails = ": Could not parse response";
              }
            }

            console.error(`[PostContext] API error: ${errorMessage}${errorDetails}`);
            // Don't throw, try the mock endpoint instead
            throw new Error(`${errorMessage}${errorDetails}`);
          }

          try {
            fetchResult = await res.json();
          } catch (err) {
            console.error("[PostContext] Error parsing response:", err);
            throw new Error("Invalid JSON response from server");
          }
        } catch (mainApiError) {
          console.warn("[PostContext] Main API failed, trying mock endpoint:", mainApiError);

          // Try the mock endpoint as fallback
          try {
            const mockRes = await fetch(`/api/posts/feed/mock-route?page=${nextPage}&limit=10`);

            if (!mockRes.ok) {
              console.error("[PostContext] Mock API also failed:", mockRes.status);
              throw mainApiError; // Re-throw the original error
            }

            fetchResult = await mockRes.json();
            console.log("[PostContext] Successfully fetched mock data");
          } catch (mockError) {
            console.error("[PostContext] Mock API also failed:", mockError);
            throw mainApiError; // Re-throw the original error
          }
        }

        // Process the data (either from main API or mock API)
        const data = fetchResult;

        console.log(`[PostContext] Fetched ${data.posts?.length || 0} posts`);

        if (!data.posts || !Array.isArray(data.posts)) {
          console.error("[PostContext] Invalid response format - posts array missing");
          throw new Error("Invalid response format");
        }

        setPosts((prev) => (reset ? data.posts : [...prev, ...data.posts]));
        setHasMore(data.pagination?.hasMore || false);
        setPage(reset ? 2 : page + 1);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("[PostContext] Error fetching posts:", errorMessage);
        setError(errorMessage);

        // If we have no posts yet, generate some mock posts client-side as a last resort
        if (reset && posts.length === 0) {
          console.log("[PostContext] Generating client-side mock posts as last resort");
          const mockPosts = generateClientSideMockPosts(10);
          setPosts(mockPosts);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [page, loading]
  );

  const fetchMorePosts = useCallback(() => fetchPosts(false), [fetchPosts]);

  const createPost = useCallback(
    async (content: string, communityId?: string, mediaUrls?: string[]): Promise<Post | null> => {
      setLoading(true);
      setError(null);
      try {
        console.log(
          `[PostContext] Creating post with content length: ${content.length}${communityId ? `, communityId: ${communityId}` : ""}${mediaUrls?.length ? `, mediaUrls: ${mediaUrls.length}` : ""}`
        );

        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, communityId, mediaUrls }),
        });

        if (!res.ok) {
          let errorMessage = `Failed to create post (${res.status})`;
          let errorDetails = "";

          try {
            // Try to parse as JSON
            const errorData = await res.json();
            if (errorData && errorData.error) {
              errorMessage = errorData.error;
              errorDetails = errorData.details ? `: ${errorData.details}` : "";
            }
          } catch (parseError) {
            // If not JSON, try to get text
            try {
              const textContent = await res.text();
              errorDetails = `: Response was not JSON (${textContent.substring(0, 50)}...)`;
            } catch (textError) {
              errorDetails = ": Could not parse response";
            }
          }

          console.error(`[PostContext] API error: ${errorMessage}${errorDetails}`);
          setError(`${errorMessage}${errorDetails}`);
          return null;
        }

        let data;
        try {
          data = await res.json();
        } catch (err) {
          console.error("[PostContext] Error parsing response:", err);
          setError("Invalid JSON response from server");
          return null;
        }

        console.log("[PostContext] Post created successfully:", data.post?.id);
        setPosts((prev) => [data.post, ...prev]);
        return data.post;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error creating post";
        console.error("[PostContext] Exception:", errorMessage);
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const votePost = useCallback(async (postId: string, voteType: "upvote" | "downvote") => {
    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });

      if (!res.ok) {
        let errorMessage;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || `Vote failed (${res.status})`;
        } catch {
          errorMessage = `Vote failed (${res.status})`;
        }
        console.error(`[PostContext] Vote error: ${errorMessage}`);
        return; // Exit early
      }

      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error("[PostContext] Error parsing vote response:", err);
        return; // Exit early
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                upvoteCount: data.upvoteCount,
                downvoteCount: data.downvoteCount,
                voteCount: data.voteCount,
                isUpvoted: data.isUpvoted,
                isDownvoted: data.isDownvoted,
              }
            : p
        )
      );
    } catch (error) {
      // Log but swallow vote errors
      console.error(
        "[PostContext] Vote operation failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }, []);

  useEffect(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
        error,
        hasMore,
        fetchMorePosts,
        createPost,
        votePost,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  const ctx = useContext(PostContext);
  if (!ctx) {
    throw new Error("usePosts must be used within a PostProvider");
  }
  return ctx;
};
