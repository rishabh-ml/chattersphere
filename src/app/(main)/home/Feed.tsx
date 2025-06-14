"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "@/features/posts/components/PostCard";
import { type Post } from "@/context/PostContext";
import { motion } from "framer-motion";

export default function Feed() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async (): Promise<void> => {
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await res.json();
        setPosts(data.posts);
        setError(null);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Failed to load posts. Please try again later.");
        setPosts(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchPosts();
  }, []);

  const renderSkeletons = () => (
    <div className="flex flex-col gap-6">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
        >
          <Skeleton className="h-32 w-full rounded-xl" />
        </motion.div>
      ))}
    </div>
  );

  const renderFallbackPost = () => {
    const now = new Date().toISOString();
    return (
      <div className="text-center">
        <p className="text-gray-500 mb-4">No posts available. Here’s a placeholder post:</p>
        <PostCard
          post={{
            id: "dummy-id",
            author: {
              id: "dummy-author-id",
              username: "placeholder",
              name: "Rishabh",
              image: undefined,
            },
            content:
              "Hey everyone! We’re in the middle of developing ChatterSphere. Thanks for joining—stay tuned for updates!",
            community: undefined,
            upvoteCount: 0,
            downvoteCount: 0,
            voteCount: 0,
            commentCount: 0,
            isUpvoted: false,
            isDownvoted: false,
            createdAt: now,
            updatedAt: now,
          }}
        />
      </div>
    );
  };

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {loading && renderSkeletons()}

      {!loading && error && (
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      )}

      {!loading && posts && posts.length > 0 && (
        <>
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </>
      )}

      {!loading && !error && (!posts || posts.length === 0) && renderFallbackPost()}
    </motion.div>
  );
}
