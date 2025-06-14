"use client";

import { useInfiniteScroll } from "@/lib/swr";
import { useEffect, useRef } from "react";
import { Post } from "@/types/post";
import PostCard from "@/components/posts/PostCard";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface PostFeedProps {
  communityId?: string;
  userId?: string;
  initialData?: {
    posts: Post[];
    pagination: {
      page: number;
      limit: number;
      totalPosts: number;
      hasMore: boolean;
    };
  };
}

export function PostFeed({ communityId, userId, initialData }: PostFeedProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Create a function to get the key for each page
  const getKey = (pageIndex: number, previousPageData: any) => {
    // Reached the end
    if (previousPageData && !previousPageData.pagination.hasMore) return null;

    // First page, we don't have previousPageData
    if (pageIndex === 0) {
      let url = `/api/posts?page=1&limit=10`;
      if (communityId) url += `&communityId=${communityId}`;
      if (userId) url += `&userId=${userId}`;
      return url;
    }

    // Add the page to the URL
    let url = `/api/posts?page=${pageIndex + 1}&limit=10`;
    if (communityId) url += `&communityId=${communityId}`;
    if (userId) url += `&userId=${userId}`;
    return url;
  };

  // Use the infinite scroll hook
  const {
    data,
    error,
    isLoadingInitialData,
    isLoadingMore,
    isEmpty,
    isReachingEnd,
    loadMore,
    refresh,
    isRefreshing,
  } = useInfiniteScroll(getKey, {
    fallbackData: initialData ? [initialData] : undefined,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    dedupingInterval: 60000, // 1 minute
  });

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef.current || isReachingEnd || isLoadingMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isReachingEnd, isLoadingMore, loadMore]);

  // Flatten the data
  const posts = data ? data.flatMap((page) => page.posts) : [];

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-4">Error loading posts</p>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Handle empty state
  if (!isLoadingInitialData && isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground mb-4">No posts found</p>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Refresh button */}
      <div className="flex justify-end mb-4">
        <Button onClick={refresh} variant="outline" size="sm" disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            content={post.content}
            author={post.author}
            community={post.community}
            createdAt={post.createdAt}
            upvoteCount={post.upvoteCount}
            downvoteCount={post.downvoteCount}
            commentCount={post.commentCount}
            isUpvoted={post.isUpvoted}
            isDownvoted={post.isDownvoted}
            isSaved={post.isSaved}
            userRole={post.userRole}
            onVote={async (postId, voteType) => {
              try {
                const response = await fetch(`/api/posts/${postId}/vote`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: voteType }),
                });
                if (!response.ok) throw new Error("Failed to vote");
                return await response.json();
              } catch (error) {
                console.error("Error voting:", error);
                throw error;
              }
            }}
            onSave={async (postId) => {
              try {
                const response = await fetch(`/api/posts/${postId}/save`, {
                  method: "POST",
                });
                if (!response.ok) throw new Error("Failed to save post");
                return await response.json();
              } catch (error) {
                console.error("Error saving post:", error);
                throw error;
              }
            }}
            onDelete={() => refresh()}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="flex justify-center p-4">
          <Spinner size="md" />
        </div>
      )}

      {/* Load more trigger */}
      {!isReachingEnd && !isLoadingMore && <div ref={loadMoreRef} className="h-10" />}

      {/* End of posts */}
      {isReachingEnd && posts.length > 0 && (
        <div className="text-center p-4 text-muted-foreground">No more posts to load</div>
      )}
    </div>
  );
}
