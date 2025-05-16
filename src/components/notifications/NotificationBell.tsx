"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationList from "./NotificationList";
import { Badge } from "@/components/ui/badge";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useUser();

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!isSignedIn) return;

    try {
      // Check if the API endpoint exists by using a HEAD request first
      try {
        const checkResponse = await fetch("/api/notifications", { method: 'HEAD' });
        if (!checkResponse.ok) {
          // If the endpoint doesn't exist, silently fail without error
          console.log("Notifications API not available");
          return;
        }
      } catch (checkError) {
        // If the check fails, silently fail without error
        console.log("Notifications API not available");
        return;
      }

      // If the check passes, proceed with the actual request
      const response = await fetch("/api/notifications?limit=1&unreadOnly=true");
      if (!response.ok) {
        // Handle server errors gracefully
        console.log("Notifications API returned an error");
        return;
      }

      const data = await response.json();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      // Log the error but don't propagate it to the UI
      console.log("Error fetching notification count - this is expected if the API doesn't exist yet");
    }
  };

  // Fetch unread count on mount and when signed in status changes
  useEffect(() => {
    if (isSignedIn) {
      fetchUnreadCount();

      // Set up polling for new notifications (every 30 seconds)
      const interval = setInterval(fetchUnreadCount, 30000);

      return () => clearInterval(interval);
    }
  }, [isSignedIn]);

  // Handle dropdown open/close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    // If closing the dropdown and there were unread notifications, mark them as read
    if (!open && unreadCount > 0) {
      markAllAsRead();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!isSignedIn || unreadCount === 0) return;

    try {
      // Check if the API endpoint exists
      try {
        const checkResponse = await fetch("/api/notifications/read-all", { method: 'HEAD' });
        if (!checkResponse.ok) {
          // If the endpoint doesn't exist, just update the UI state
          setUnreadCount(0);
          return;
        }
      } catch (checkError) {
        // If the check fails, just update the UI state
        setUnreadCount(0);
        return;
      }

      const response = await fetch("/api/notifications/read-all", {
        method: "PUT",
      });

      if (!response.ok) {
        // Just update the UI state even if the API fails
        setUnreadCount(0);
        return;
      }

      setUnreadCount(0);
    } catch (error) {
      // Log the error but still update the UI state
      console.log("Error marking notifications as read - this is expected if the API doesn't exist yet");
      setUnreadCount(0);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          disabled={!isSignedIn}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <NotificationList onMarkAsRead={() => setUnreadCount(prev => Math.max(0, prev - 1))} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
