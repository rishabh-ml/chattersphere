"use client";

import { motion } from "framer-motion";
import { PopularPostProvider } from "@/context/PopularPostContext";
import { PostProvider } from "@/context/PostContext";
import PopularPostFeed from "@/features/posts/components/popular-post-feed";
import CreatePostForm from "@/features/posts/components/create-post-form";
import { useUser } from "@clerk/nextjs";
import { StandardPageWrapper } from "@/components/layouts/StandardPageWrapper";

export default function PopularPage() {
  const { isSignedIn } = useUser();

  return (
    <StandardPageWrapper>
      <div className="space-y-6">
        <motion.h1
          className="text-2xl font-semibold text-gray-800 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Popular Posts
        </motion.h1>

        {/* Create Post Form */}
        {isSignedIn && (
          <PostProvider>
            <CreatePostForm />
          </PostProvider>
        )}

        <PopularPostProvider>
          <PopularPostFeed />
        </PopularPostProvider>
      </div>
    </StandardPageWrapper>
  );
}
