"use client";

import { useEffect, useRef, useCallback } from "react";
import PostCard from "@/components/post-card";
import { usePopularPosts } from "@/context/PopularPostContext";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, Clock, Calendar, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostSkeleton from "@/components/skeletons/post-skeleton";

interface PopularPostFeedProps {
  emptyMessage?: string;
}

export default function PopularPostFeed({ emptyMessage = "No popular posts to show" }: PopularPostFeedProps) {
  const { posts, loading, error, hasMore, fetchMorePosts, votePost, timeRange, setTimeRange } = usePopularPosts();
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
      <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={timeRange === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('day')}
            className={timeRange === 'day' ? 'bg-[#00AEEF] hover:bg-[#00AEEF]/90' : ''}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('week')}
            className={timeRange === 'week' ? 'bg-[#00AEEF] hover:bg-[#00AEEF]/90' : ''}
          >
            <Clock className="h-4 w-4 mr-2" />
            This Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('month')}
            className={timeRange === 'month' ? 'bg-[#00AEEF] hover:bg-[#00AEEF]/90' : ''}
          >
            <Calendar className="h-4 w-4 mr-2" />
            This Month
          </Button>
          <Button
            variant={timeRange === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('all')}
            className={timeRange === 'all' ? 'bg-[#00AEEF] hover:bg-[#00AEEF]/90' : ''}
          >
            <History className="h-4 w-4 mr-2" />
            All Time
          </Button>
        </div>
      </div>

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
              <PostSkeleton key="popular-skeleton-1" />
              <PostSkeleton key="popular-skeleton-2" />
              <PostSkeleton key="popular-skeleton-3" />
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
