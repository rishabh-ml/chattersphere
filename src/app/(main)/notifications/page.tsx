"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Heart, MessageSquare, UserPlus, Users, Star, Settings, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@clerk/nextjs"
import { formatDistanceToNow } from "date-fns"
import { Avatar } from "@/components/ui/avatar"
import { toast } from "sonner"
import { NotificationType } from "@/models/Notification"

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    name: string;
    image?: string;
  };
  relatedPost?: {
    id: string;
    content: string;
  };
  relatedComment?: {
    id: string;
    content: string;
  };
  relatedCommunity?: {
    id: string;
    name: string;
    image?: string;
  };
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const { isSignedIn } = useUser()

  // Fetch notifications
  const fetchNotifications = async (pageNum: number = 1, filter?: string) => {
    if (!isSignedIn) return;

    try {
      setLoading(true);
      let url = `/api/notifications?page=${pageNum}&limit=20`;

      if (filter === "unread") {
        url += "&unreadOnly=true";
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();

      if (pageNum === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }

      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
      setError(null);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isSignedIn) {
      fetchNotifications(1, activeTab === "unread" ? "unread" : undefined);
    }
  }, [isSignedIn, activeTab]);

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === "all"
    ? notifications
    : activeTab === "unread"
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => {
          switch (activeTab) {
            case "comments":
              return n.type === "comment" || n.type === "reply";
            case "likes":
              return n.type === "post_like" || n.type === "comment_like";
            case "follows":
              return n.type === "follow";
            case "communities":
              return n.type === "community_invite" || n.type === "community_join";
            default:
              return true;
          }
        });

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!isSignedIn) return;

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId: string) => {
    if (!isSignedIn) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    fetchNotifications(page + 1, activeTab === "unread" ? "unread" : undefined);
  };

  // Get icon based on notification type
  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "comment":
      case "reply":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "post_like":
      case "comment_like":
        return <Heart className="h-4 w-4 text-pink-500" />;
      case "mention":
        return <Star className="h-4 w-4 text-amber-500" />;
      case "community_invite":
      case "community_join":
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <motion.h1
          className="text-2xl font-semibold text-gray-800"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Notifications
        </motion.h1>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="text-sm"
            disabled={!isSignedIn || notifications.filter(n => !n.read).length === 0}
          >
            Mark all as read
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500"
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Notification Settings</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 md:w-fit">
          <TabsTrigger value="all" aria-selected={activeTab === "all"}>All</TabsTrigger>
          <TabsTrigger value="unread" aria-selected={activeTab === "unread"}>Unread</TabsTrigger>
          <TabsTrigger value="likes" aria-selected={activeTab === "likes"}>Likes</TabsTrigger>
          <TabsTrigger value="comments" aria-selected={activeTab === "comments"}>Comments</TabsTrigger>
          <TabsTrigger value="follows" aria-selected={activeTab === "follows"}>Follows</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : error && notifications.length === 0 ? (
          <div className="p-8 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.length > 0 ? (
              <motion.div
                className="divide-y divide-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {notification.sender?.image ? (
                          <Avatar className="h-8 w-8">
                            <img
                              src={notification.sender.image}
                              alt={notification.sender.name}
                              className="h-full w-full object-cover"
                            />
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            {getIconForType(notification.type)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>

                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-[#00AEEF]"></div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {hasMore && (
                  <div className="p-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load more"
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                className="p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">No notifications</h3>
                <p className="text-sm text-gray-500">You&#39;re all caught up!</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
