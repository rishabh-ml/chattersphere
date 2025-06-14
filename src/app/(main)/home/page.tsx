"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { PostProvider } from "@/context/PostContext";
import { PopularPostProvider } from "@/context/PopularPostContext";
import { CommunityProvider } from "@/context/CommunityContext";
import { HomeFeedProvider } from "@/context/HomeFeedContext";
import HomeFeed from "@/components/home-feed";
import PopularPostFeed from "@/components/popular-post-feed";
import CommunityList from "@/components/community-list";
import CreatePostForm from "@/components/create-post-form";
import { StandardPageWrapper } from "@/components/layouts/StandardPageWrapper";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState("feed");

  return (
    <StandardPageWrapper>
      <div className="space-y-6">
        {/* Header with welcome message if signed in */}
        <div className="mb-6">
          {isSignedIn ? (
            <motion.h1
              className="text-2xl font-semibold text-gray-800"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              Welcome back, {user?.firstName || "there"}! 👋
            </motion.h1>
          ) : (
            <h1 className="text-2xl font-semibold text-gray-800">Explore the community</h1>
          )}
        </div>

        {/* Feed Tabs */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="feed" aria-selected={activeTab === "feed"}>
                Home Feed
              </TabsTrigger>
              <TabsTrigger value="popular" aria-selected={activeTab === "popular"}>
                Popular
              </TabsTrigger>
              <TabsTrigger value="communities" aria-selected={activeTab === "communities"}>
                Communities
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Create Post Form */}
        {isSignedIn && activeTab !== "communities" && (
          <PostProvider>
            <CreatePostForm />
          </PostProvider>
        )}

        {/* Tab Content */}
        {activeTab === "feed" && (
          <HomeFeedProvider>
            <HomeFeed />
          </HomeFeedProvider>
        )}

        {activeTab === "popular" && (
          <PopularPostProvider>
            <PopularPostFeed />
          </PopularPostProvider>
        )}

        {activeTab === "communities" && (
          <CommunityProvider>
            <CommunityList />
          </CommunityProvider>
        )}
      </div>
    </StandardPageWrapper>
  );
}
