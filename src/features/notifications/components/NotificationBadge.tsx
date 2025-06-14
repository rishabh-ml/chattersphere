"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/shared/utils/cn";
import { useNotifications } from "../hooks/useNotifications";

interface NotificationBadgeProps {
  className?: string;
  count?: number;
}

export default function NotificationBadge({ className, count }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isSignedIn, isLoaded } = useUser();

  // Try to use the notification hook
  let notificationsHook: any = null;
  try {
    notificationsHook = useNotifications();
  } catch (error) {
    // If the hook is not available, we'll fetch the count directly
    console.log("useNotifications hook not available, will fetch count directly");
  }

  useEffect(() => {
    // Create an AbortController for this effect instance
    const controller = new AbortController();

    const fetchUnreadCount = async () => {
      // Skip if the user is not signed in or if we have a direct count prop
      if (!isLoaded || !isSignedIn || count !== undefined) {
        setIsLoading(false);
        return;
      }

      // Try to get count from hook first if available
      if (notificationsHook) {
        setUnreadCount(notificationsHook.unreadCount);
        setIsLoading(false);
        return;
      }

      // Fall back to direct API call if hook is not available
      try {
        const response = await fetch("/api/notifications/unread", {
          signal: controller.signal,
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch unread notifications count");

        const data = await response.json();
        setUnreadCount(data.count || 0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error fetching unread notifications count:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnreadCount();

    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(fetchUnreadCount, 30000);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      controller.abort();
    };
  }, [isLoaded, isSignedIn, count, notificationsHook]);

  // If a count is explicitly provided, use that instead
  const displayCount = count !== undefined ? count : unreadCount;

  // Don't show anything while loading or if count is 0
  if (isLoading || displayCount <= 0) return null;

  return (
    <Badge
      variant="destructive"
      className={cn(
        "rounded-full h-5 min-w-5 flex items-center justify-center text-xs font-medium",
        className
      )}
    >
      {displayCount > 99 ? "99+" : displayCount}
    </Badge>
  );
}
