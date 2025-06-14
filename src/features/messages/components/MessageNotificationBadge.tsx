"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/shared/utils/cn";
import { useMessagesContext } from "../contexts/MessagesContext";

interface MessageNotificationBadgeProps {
  className?: string;
  count?: number;
}

export default function MessageNotificationBadge({
  className,
  count,
}: MessageNotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isSignedIn, isLoaded } = useUser();

  // Try to use the messages context
  let messagesContext: any = null;
  try {
    messagesContext = useMessagesContext();
  } catch (error) {
    // If the context is not available, we'll fetch the count directly
    console.log("MessagesContext not available, will fetch count directly");
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

      // Try to get count from context first if available
      if (messagesContext) {
        setUnreadCount(messagesContext.unreadCount);
        setIsLoading(false);
        return;
      }

      // Fall back to direct API call if context is not available
      try {
        const response = await fetch("/api/messages/unread", {
          signal: controller.signal,
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch unread messages count");

        const data = await response.json();
        setUnreadCount(data.count || 0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error fetching unread messages count:", error);
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
  }, [isLoaded, isSignedIn, count, messagesContext]);

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
