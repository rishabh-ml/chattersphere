"use client";

import { useEffect, useRef, useCallback } from "react";
import { useHomeFeed, FeedType, SortOption } from "@/context/HomeFeedContext";
import PostCard from "@/components/post-card";
import { motion } from "framer-motion";
import { Loader2, Filter, TrendingUp, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostSkeleton from "@/components/skeletons/post-skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@clerk/nextjs";

interface HomeFeedProps {
  emptyMessage?: string;
}

export default function HomeFeed({ emptyMessage = "No posts to show" }: HomeFeedProps) {
  const { isSignedIn } = useUser();
  const {
    posts,
    loading,
    error,
    hasMore,
    fetchMorePosts,
    votePost,
    savePost,
    feedType,
    setFeedType,
    sortOption,
    setSortOption,
  } = useHomeFeed();

  const observer = useRef<IntersectionObserver | null>(null);

  // Set up the intersection observer for infinite scrolling
  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchMorePosts();
        }
      });

      if (node) {
        observer.current.observe(node);
      }
    },
    [loading, hasMore, fetchMorePosts]
  );

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  // Handle feed type change
  const handleFeedTypeChange = (value: string) => {
    setFeedType(value as FeedType);
  };

  // Handle sort option change
  const handleSortOptionChange = (value: string) => {
    setSortOption(value as SortOption);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        <p>Error loading posts: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feed Type Tabs */}
      <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6">
        <Tabs value={feedType} onValueChange={handleFeedTypeChange} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">For You</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Following</span>
            </TabsTrigger>
            <TabsTrigger value="joined" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Communities</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={sortOption === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortOption("new")}
          className={sortOption === "new" ? "bg-[#00AEEF] hover:bg-[#00AEEF]/90" : ""}
        >
          <Clock className="h-4 w-4 mr-2" />
          New
        </Button>
        <Button
          variant={sortOption === "top" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortOption("top")}
          className={sortOption === "top" ? "bg-[#00AEEF] hover:bg-[#00AEEF]/90" : ""}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Top
        </Button>
        <Button
          variant={sortOption === "trending" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortOption("trending")}
          className={sortOption === "trending" ? "bg-[#00AEEF] hover:bg-[#00AEEF]/90" : ""}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Trending
        </Button>
      </div>

      {/* Posts */}
      {posts.length === 0 && !loading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
          <p className="text-gray-500">
            {isSignedIn
              ? "Your feed is empty. Follow users or join communities to see posts here!"
              : "Sign in to see a personalized feed!"}
          </p>
        </div>
      ) : (
        posts.map((post, index) => {
          if (index === posts.length - 1) {
            return (
              <div key={post.id} ref={lastPostRef}>
                <PostCard post={post} onVote={votePost} onSave={savePost} />
              </div>
            );
          } else {
            return <PostCard key={post.id} post={post} onVote={votePost} onSave={savePost} />;
          }
        })
      )}

      {/* Loading States */}
      {loading && (
        <div className="space-y-6">
          {posts.length === 0 ? (
            // Show skeletons when initially loading
            <>
              <PostSkeleton key="home-skeleton-1" />
              <PostSkeleton key="home-skeleton-2" />
              <PostSkeleton key="home-skeleton-3" />
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
