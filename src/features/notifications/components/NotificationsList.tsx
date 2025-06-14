"use client";

import { useState } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  User,
  MessageSquare,
  Heart,
  UserPlus,
  Users,
  Mail,
  Bell,
  CheckCheck,
  Loader2,
  X,
  ExternalLink,
} from "lucide-react";
import { Avatar } from "@/shared/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/shared/utils/cn";
import { Notification, NotificationType } from "../types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NotificationsList() {
  const {
    notifications,
    hasMoreNotifications,
    isLoadingNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isFetchingNextPage,
  } = useNotifications();

  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const router = useRouter();

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.POST_MENTION:
      case NotificationType.COMMENT_MENTION:
        return <MessageSquare className="h-4 w-4" />;
      case NotificationType.POST_UPVOTE:
      case NotificationType.COMMENT_UPVOTE:
        return <Heart className="h-4 w-4" />;
      case NotificationType.NEW_FOLLOWER:
        return <UserPlus className="h-4 w-4" />;
      case NotificationType.COMMUNITY_INVITE:
      case NotificationType.COMMUNITY_ROLE_CHANGE:
        return <Users className="h-4 w-4" />;
      case NotificationType.DIRECT_MESSAGE:
        return <Mail className="h-4 w-4" />;
      case NotificationType.SYSTEM_NOTIFICATION:
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get notification text based on type
  const getNotificationText = (notification: Notification) => {
    const actor = notification.actor?.name || "Someone";

    switch (notification.type) {
      case NotificationType.POST_MENTION:
        return `${actor} mentioned you in a post`;
      case NotificationType.COMMENT_MENTION:
        return `${actor} mentioned you in a comment`;
      case NotificationType.COMMENT_REPLY:
        return `${actor} replied to your comment`;
      case NotificationType.POST_UPVOTE:
        return `${actor} upvoted your post`;
      case NotificationType.COMMENT_UPVOTE:
        return `${actor} upvoted your comment`;
      case NotificationType.NEW_FOLLOWER:
        return `${actor} started following you`;
      case NotificationType.COMMUNITY_INVITE:
        return `${actor} invited you to join a community`;
      case NotificationType.COMMUNITY_ROLE_CHANGE:
        return `Your role was updated in a community`;
      case NotificationType.DIRECT_MESSAGE:
        return `${actor} sent you a message`;
      case NotificationType.SYSTEM_NOTIFICATION:
        return notification.target.title || "System notification";
      default:
        return "New notification";
    }
  };

  // Handle click on a notification
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      // Navigate to the target
      if (notification.target.url) {
        router.push(notification.target.url);
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    setIsMarkingAllAsRead(true);
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
      console.error("Error marking all notifications as read:", error);
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await deleteNotification(notificationId);
      toast.success("Notification removed");
    } catch (error) {
      toast.error("Failed to remove notification");
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={isMarkingAllAsRead || isLoadingNotifications || notifications.length === 0}
        >
          {isMarkingAllAsRead ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4 mr-2" />
          )}
          Mark all read
        </Button>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        {isLoadingNotifications && notifications.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            <p className="text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">
              When you get notifications, they'll appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {" "}
            {notifications.map((notification: any) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 transition-colors hover:bg-gray-50 cursor-pointer flex items-start",
                  !notification.isRead && "bg-blue-50 hover:bg-blue-50"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Icon or avatar */}
                <div className="flex-shrink-0 mr-3">
                  {notification.actor ? (
                    <Avatar className="h-10 w-10">
                      <img
                        src={notification.actor.image || `/avatars/placeholder.png`}
                        alt={notification.actor.name}
                      />
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start">
                    <p
                      className={cn(
                        "text-sm",
                        !notification.isRead ? "font-medium text-gray-900" : "text-gray-700"
                      )}
                    >
                      {getNotificationText(notification)}
                    </p>

                    <div className="flex items-center ml-2">
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-6 w-6 p-0"
                        onClick={(e: React.MouseEvent) =>
                          handleDeleteNotification(notification.id, e)
                        }
                      >
                        <X className="h-4 w-4 text-gray-400" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>

                  {notification.target.content && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {notification.target.content}
                    </p>
                  )}

                  {notification.target.url && (
                    <div className="mt-1 flex items-center">
                      <ExternalLink className="h-3 w-3 text-gray-400 mr-1" />
                      <p className="text-xs text-gray-500">{notification.target.type}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMoreNotifications && (
          <div className="p-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMoreNotifications()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Load more"}
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
