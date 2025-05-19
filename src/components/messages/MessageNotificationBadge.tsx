"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface MessageNotificationBadgeProps {
  className?: string;
  count?: number;
}

export default function MessageNotificationBadge({ className, count }: MessageNotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isSignedIn, isLoaded } = useUser();

  // Try to import the DirectMessageContext, but handle the case where it's not available
  let directMessagesContext: any = null;
  try {
    // Dynamic import to avoid circular dependencies
    const { useDirectMessages } = require("@/context/DirectMessageContext");
    directMessagesContext = useDirectMessages();
  } catch (error) {
    // If the context is not available, we'll fetch the count directly
    console.log("DirectMessageContext not available, will fetch count directly");
  }

  useEffect(() => {
    // Create an AbortController for this effect instance
    const controller = new AbortController();
    let intervalId: NodeJS.Timeout | null = null;

    // If count is provided as a prop, use that
    if (count !== undefined) {
      setUnreadCount(count);
      setIsLoading(false);
      return;
    }

    // If we're not signed in yet, don't try to fetch
    if (!isLoaded || !isSignedIn) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    // If we have access to the DirectMessageContext, use that
    if (directMessagesContext) {
      const fetchAndUpdate = async () => {
        try {
          await directMessagesContext.fetchConversations();
          setUnreadCount(directMessagesContext.getUnreadCount());
        } catch (error) {
          // Only log errors that aren't abort errors
          if (!(error instanceof DOMException && error.name === 'AbortError')) {
            console.error("Error fetching conversations:", error);
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchAndUpdate();

      // Set up interval to fetch conversations every minute
      intervalId = setInterval(fetchAndUpdate, 60000); // 1 minute

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      };
    } else {
      // Otherwise, fetch the count from the API directly
      const fetchUnreadCount = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/messages/unread/count', {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUnreadCount(data.count || 0);
          } else {
            console.error('Failed to fetch unread message count');
            setUnreadCount(0);
          }
        } catch (error) {
          // Only log errors that aren't abort errors
          if (!(error instanceof DOMException && error.name === 'AbortError')) {
            console.error('Error fetching unread message count:', error);
          }
          setUnreadCount(0);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUnreadCount();

      // Set up a polling interval to check for new messages
      intervalId = setInterval(fetchUnreadCount, 60000); // Check every minute

      return () => {
        // Clean up interval
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }

        // Abort any in-flight requests
        controller.abort();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded, count]); // Intentionally omitting directMessagesContext to avoid infinite loops

  // Update unread count when the context changes
  useEffect(() => {
    if (count !== undefined) {
      setUnreadCount(count);
    } else if (directMessagesContext) {
      try {
        const unreadCount = directMessagesContext.getUnreadCount();
        setUnreadCount(unreadCount);
      } catch (error) {
        // If there's an error getting the unread count, don't update
        console.error("Error getting unread count from context:", error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]); // Intentionally omitting directMessagesContext to avoid infinite loops

  if (isLoading || unreadCount === 0) {
    return null;
  }

  return (
    <Badge className={cn(
      "bg-red-500 text-white text-xs px-1.5 min-w-5 h-5 flex items-center justify-center rounded-full",
      className
    )}>
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}
