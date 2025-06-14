"use client";

import { useEffect, useRef, useCallback } from "react";
import PostCard from "@/components/post-card";
import { useSavedPosts } from "@/context/SavedPostContext";
import { motion } from "framer-motion";
import { Loader2, Bookmark } from "lucide-react";
import PostSkeleton from "@/components/skeletons/post-skeleton";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface SavedPostFeedProps {
  emptyMessage?: string;
}

export default function SavedPostFeed({
  emptyMessage = "No saved posts to show",
}: SavedPostFeedProps) {
  const { posts, loading, error, hasMore, fetchMorePosts, votePost, savePost } = useSavedPosts();
  const { isSignedIn } = useUser();
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

  // Handle post voting
  const handleVote = async (postId: string, voteType: "upvote" | "downvote") => {
    await votePost(postId, voteType);
  };

  // Handle post saving/unsaving
  const handleSave = async (postId: string) => {
    await savePost(postId);
  };

  if (!isSignedIn) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
        <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-800 mb-1">Sign in to see your saved posts</h3>
        <p className="text-sm text-gray-500 mb-4">
          You need to be signed in to save and view posts
        </p>
        <Button className="bg-[#00AEEF] hover:bg-[#00AEEF]/90 text-white">Sign In</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        <p>Error loading saved posts: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.length === 0 && !loading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
          <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-800 mb-1">No saved posts yet</h3>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        posts.map((post, index) => {
          if (index === posts.length - 1) {
            return (
              <div key={post.id} ref={lastPostRef}>
                <PostCard post={post} onVote={handleVote} />
              </div>
            );
          } else {
            return <PostCard key={post.id} post={post} onVote={handleVote} />;
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
