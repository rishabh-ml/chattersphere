"use client";

import { MessageSquare, X, Users, TrendingUp, Calendar } from "lucide-react";
import MessageNotificationBadge from "@/components/messages/MessageNotificationBadge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingTopic {
  id: string;
  topic: string;
  posts: number;
}

interface SuggestedCommunity {
  id: string;
  name: string;
  members: string;
  color: string;
  slug: string;
}

export function RightSidebar() {
  const router = useRouter();
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<SuggestedCommunity[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Fetch trending topics
  useEffect(() => {
    async function fetchTrendingTopics() {
      try {
        const response = await fetch("/api/topics/trending");
        if (response.ok) {
          const data = await response.json();
          setTrendingTopics(data.topics || []);
        } else {
          // If API fails, use fallback data
          setTrendingTopics([
            { id: "1", topic: "Web Development", posts: 128 },
            { id: "2", topic: "AI News", posts: 96 },
            { id: "3", topic: "Remote Work", posts: 84 },
          ]);
        }
      } catch (error) {
        console.error("Error fetching trending topics:", error);
        // Fallback data
        setTrendingTopics([
          { id: "1", topic: "Web Development", posts: 128 },
          { id: "2", topic: "AI News", posts: 96 },
          { id: "3", topic: "Remote Work", posts: 84 },
        ]);
      } finally {
        setLoadingTopics(false);
      }
    }

    fetchTrendingTopics();
  }, []);

  // Fetch suggested communities
  useEffect(() => {
    async function fetchSuggestedCommunities() {
      try {
        const response = await fetch("/api/communities/suggested");
        if (response.ok) {
          const data = await response.json();
          setSuggestedCommunities(data.communities || []);
        } else {
          // If API fails, use fallback data
          setSuggestedCommunities([
            {
              id: "1",
              name: "Photography",
              members: "12.4k",
              color: "bg-purple-500",
              slug: "photography",
            },
            { id: "2", name: "GameDev", members: "8.7k", color: "bg-green-500", slug: "gamedev" },
            { id: "3", name: "BookClub", members: "5.2k", color: "bg-amber-500", slug: "bookclub" },
          ]);
        }
      } catch (error) {
        console.error("Error fetching suggested communities:", error);
        // Fallback data
        setSuggestedCommunities([
          {
            id: "1",
            name: "Photography",
            members: "12.4k",
            color: "bg-purple-500",
            slug: "photography",
          },
          { id: "2", name: "GameDev", members: "8.7k", color: "bg-green-500", slug: "gamedev" },
          { id: "3", name: "BookClub", members: "5.2k", color: "bg-amber-500", slug: "bookclub" },
        ]);
      } finally {
        setLoadingCommunities(false);
      }
    }

    fetchSuggestedCommunities();
  }, []);

  // Fetch unread message count
  useEffect(() => {
    async function fetchUnreadMessageCount() {
      try {
        const response = await fetch("/api/messages/unread/count");
        if (response.ok) {
          const data = await response.json();
          setUnreadMessageCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching unread message count:", error);
        setUnreadMessageCount(0);
      }
    }

    fetchUnreadMessageCount();

    // Set up polling for unread messages every 30 seconds
    const interval = setInterval(fetchUnreadMessageCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="hidden lg:block w-80 border-l border-gray-100 bg-white overflow-y-auto p-4 sticky top-16 h-[calc(100vh-4rem)]">
      {/* Trending Topics */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Trending Topics</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-[#00AEEF]"
            onClick={() => router.push("/topics")}
          >
            View All
          </Button>
        </div>

        <div className="space-y-3">
          {loadingTopics ? (
            // Loading skeletons
            Array(3)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
          ) : trendingTopics.length > 0 ? (
            // Actual trending topics
            trendingTopics.slice(0, 3).map((item, index) => (
              <motion.div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(`/topics/${encodeURIComponent(item.topic)}`)}
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 text-[#00AEEF]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.topic}</p>
                  <p className="text-xs text-gray-500">{item.posts} posts</p>
                </div>
              </motion.div>
            ))
          ) : (
            // No trending topics
            <div className="text-center py-3 text-sm text-gray-500">
              No trending topics available
            </div>
          )}
        </div>
      </div>

      {/* DMs Section - Moved up for better visibility */}
      {/* DMs Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Direct Messages</h3>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-[#00AEEF]">
            View All
          </Button>
        </div>

        <motion.div
          className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center"
          whileHover={{
            y: -2,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative inline-block mx-auto mb-2">
            <MessageSquare className="h-8 w-8 text-[#00AEEF]" />
            {unreadMessageCount > 0 && (
              <MessageNotificationBadge
                count={unreadMessageCount}
                className="absolute -top-2 -right-2"
              />
            )}
          </div>
          <h4 className="text-sm font-medium text-gray-800 mb-1">Direct Messages</h4>
          <p className="text-xs text-gray-600 mb-3">Chat with other members of your communities</p>
          <Button
            size="sm"
            className="bg-[#00AEEF] hover:bg-[#0099d6] text-white w-full"
            onClick={() => router.push("/messages")}
          >
            Open Messages
          </Button>
        </motion.div>
      </div>

      {/* Communities to Join */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Suggested Communities</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-[#00AEEF]"
            onClick={() => router.push("/communities")}
          >
            See More
          </Button>
        </div>

        <div className="space-y-3">
          {loadingCommunities ? (
            // Loading skeletons
            Array(3)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-14 rounded-md" />
                </div>
              ))
          ) : suggestedCommunities.length > 0 ? (
            // Actual suggested communities
            suggestedCommunities.map((community, index) => (
              <motion.div
                key={community.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => router.push(`/communities/${community.slug}`)}
                >
                  <div
                    className={`h-8 w-8 rounded-full ${community.color} flex items-center justify-center shadow-sm`}
                  >
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{community.name}</p>
                    <p className="text-xs text-gray-500">{community.members} members</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-[#00AEEF] text-[#00AEEF] hover:bg-blue-50"
                  onClick={() => router.push(`/communities/${community.slug}/join`)}
                >
                  Join
                </Button>
              </motion.div>
            ))
          ) : (
            // No suggested communities
            <div className="text-center py-3 text-sm text-gray-500">
              No suggested communities available
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
