"use client";

import { useEffect, useRef, useCallback } from "react";
import PostCard from "@/components/post-card";
import { usePosts } from "@/context/PostContext";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import PostSkeleton from "@/components/skeletons/post-skeleton";

interface PostFeedProps {
  emptyMessage?: string;
}

export default function PostFeed({ emptyMessage = "No posts to show" }: PostFeedProps) {
  const { posts, loading, error, hasMore, fetchMorePosts, votePost } = usePosts();
  const observer = useRef<IntersectionObserver | null>(null);

  // Set up the intersection observer for infinite scrolling
  const lastPostRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMorePosts();
      }
    });

    if (node) {
      observer.current.observe(node);
    }
  }, [loading, hasMore, fetchMorePosts]);

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        <p>Error loading posts: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.length === 0 && !loading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        posts.map((post, index) => {
          if (index === posts.length - 1) {
            return (
              <div key={post.id} ref={lastPostRef}>
                <PostCard post={post} onVote={votePost} />
              </div>
            );
          } else {
            return <PostCard key={post.id} post={post} onVote={votePost} />;
          }
        })
      )}

      {loading && (
        <div className="space-y-6">
          {posts.length === 0 ? (
            // Show skeletons when initially loading
            <>
              <PostSkeleton key="skeleton-1" />
              <PostSkeleton key="skeleton-2" />
              <PostSkeleton key="skeleton-3" />
            </>
          ) : (
            // Show spinner when loading more posts
            <motion.div
              className="flex justify-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Loader2 className="h-8 w-8 text-[#00AEEF] animate-spin" />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
