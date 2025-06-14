"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Bell, User, MessageSquare, Heart, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { useNavigation, routes } from "@/lib/navigation";
import { NotificationType } from "@/models/Notification";
import { useUser } from "@clerk/nextjs";

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

interface NotificationListProps {
  onMarkAsRead?: () => void;
  limit?: number;
  isDropdown?: boolean;
}

export default function NotificationList({
  onMarkAsRead,
  limit = 5,
  isDropdown = true,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigation = useNavigation();
  const { isSignedIn, isLoaded } = useUser();

  // Fetch notifications
  const fetchNotifications = async (pageNum: number = 1) => {
    // Don't fetch if user is not signed in
    if (isLoaded && !isSignedIn) {
      setLoading(false);
      setError("You must be signed in to view notifications");
      return;
    }

    // Don't fetch if Clerk is still loading
    if (!isLoaded) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/notifications?page=${pageNum}&limit=${limit}&_=${timestamp}`,
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to fetch notifications";
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Check if the response has the expected structure
      if (!data || !Array.isArray(data.notifications)) {
        throw new Error("Invalid response format from server");
      }

      if (pageNum === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications((prev) => [...prev, ...data.notifications]);
      }

      setHasMore(data.pagination?.hasMore || false);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(error instanceof Error ? error.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Initial load - fetch when user is loaded and signed in
  useEffect(() => {
    if (isLoaded) {
      fetchNotifications();
    }
  }, [isLoaded, isSignedIn]);

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );

      // Call the callback if provided
      if (onMarkAsRead) {
        onMarkAsRead();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "comment":
      case "reply":
      case "post_like":
      case "comment_like":
        if (notification.relatedPost) {
          navigation.goToPost(notification.relatedPost.id);
        }
        break;
      case "follow":
        if (notification.sender) {
          navigation.goToProfile(notification.sender.id);
        }
        break;
      case "community_invite":
      case "community_join":
        if (notification.relatedCommunity) {
          navigation.goToCommunity(
            notification.relatedCommunity.id,
            notification.relatedCommunity.id
          );
        }
        break;
      default:
        break;
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "comment":
      case "reply":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "follow":
        return <User className="h-4 w-4 text-green-500" />;
      case "post_like":
      case "comment_like":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "community_invite":
      case "community_join":
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="p-4 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <div className="p-4 text-center text-red-500">
        <div className="flex flex-col items-center justify-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
          {error.includes("Failed to fetch") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNotifications()}
              className="mt-2"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className={isDropdown ? "py-2" : ""}>
      <div className={isDropdown ? "px-4 py-2 font-medium border-b" : "mb-4 text-lg font-semibold"}>
        Notifications
      </div>

      <div className={isDropdown ? "max-h-[400px] overflow-y-auto" : ""}>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 ${isDropdown ? "hover:bg-gray-50" : "border-b border-gray-100 py-4"} cursor-pointer ${
              !notification.read ? "bg-blue-50" : ""
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0">
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
                    {getNotificationIcon(notification.type)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 mb-1">{notification.message}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <span>
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && !isDropdown && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(page + 1)}
            disabled={loading}
          >
            {loading ? (
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

      {isDropdown && (
        <div className="p-2 border-t text-center">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
            asChild
          >
            <Link href="/notifications">View all notifications</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
