"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export interface Attachment {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface MessageSender {
  id: string;
  username: string;
  name: string;
  image?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: MessageSender;
  attachments: Attachment[];
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  userId: string;
  username: string;
  name: string;
  image?: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageId: string;
  unreadCount: number;
}

interface DirectMessageContextType {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  hasMoreMessages: boolean;
  messagesPage: number;
  fetchConversations: () => Promise<void>;
  fetchMessages: (userId: string, page?: number) => Promise<void>;
  sendMessage: (userId: string, content: string, attachments?: Attachment[]) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  setActiveConversation: (userId: string | null) => void;
  getUnreadCount: () => number;
}

const DirectMessageContext = createContext<DirectMessageContextType | undefined>(undefined);

export function DirectMessageProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);

  // Create a ref for the AbortController to persist across renders
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Fetch conversations when the user signs in
  useEffect(() => {
    let retryCount = 0;
    let retryTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Create a new AbortController for this effect instance
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const attemptFetch = async () => {
      if (!isSignedIn || !isMounted) return;

      try {
        // Pass the AbortController signal to fetchConversations
        await fetchConversations(abortControllerRef.current?.signal);
      } catch (error: any) {
        // Only retry if it's not an abort error and component is still mounted
        if (
          isMounted &&
          retryCount < 3 &&
          !(
            error instanceof DOMException &&
            (error.name === "AbortError" || error.name === "TimeoutError")
          )
        ) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, retryCount + 1) * 1000;
          console.log(`Retrying conversation fetch in ${delay}ms (attempt ${retryCount + 1}/3)`);

          retryTimeout = setTimeout(() => {
            if (isMounted) {
              retryCount++;
              attemptFetch();
            }
          }, delay);
        }
      }
    };

    if (isSignedIn) {
      attemptFetch();
    }

    // Cleanup function
    return () => {
      isMounted = false;

      // Clear any pending retry timeout
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }

      // Abort any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]); // Only depend on isSignedIn to avoid re-creating the effect on every render

  // Fetch conversations
  const fetchConversations = async (signal?: AbortSignal) => {
    if (!isSignedIn) return;

    setIsLoadingConversations(true);

    let timeoutId: NodeJS.Timeout | null = null;
    const localController = signal ? null : new AbortController();
    const effectiveSignal = signal || localController?.signal;

    try {
      // Set up timeout if we're using a local controller
      if (localController) {
        timeoutId = setTimeout(() => {
          localController.abort(new DOMException("Timeout exceeded", "TimeoutError"));
        }, 10000); // 10 second timeout
      }

      const timestamp = new Date().getTime();
      const response = await fetch(`/api/messages?_=${timestamp}`, {
        signal: effectiveSignal,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      // Clear the timeout as soon as the response is received
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch conversations");
      }

      const data = await response.json();

      // Validate the response structure
      if (!data || !Array.isArray(data.conversations)) {
        throw new Error("Invalid response format");
      }

      setConversations(data.conversations || []);
      return data.conversations;
    } catch (error: any) {
      // Don't log abort errors as they're expected when navigating away
      if (
        !(
          error instanceof DOMException &&
          (error.name === "AbortError" || error.name === "TimeoutError")
        )
      ) {
        console.error("Error fetching conversations:", error);
      }

      // Only show toast error if it's not an abort error or if it's a timeout
      if (
        !(error instanceof DOMException && error.name === "AbortError") ||
        (error instanceof DOMException && error.message === "Timeout exceeded")
      ) {
        // Prevent multiple identical toasts
        toast.dismiss();

        // Show a more specific message for timeouts
        if (error instanceof DOMException && error.message === "Timeout exceeded") {
          toast.error("Request timed out. Please try again later.", {
            id: "conversation-timeout-error",
            duration: 3000,
          });
        } else {
          toast.error("Failed to load conversations", {
            id: "conversation-error",
            duration: 3000,
          });
        }
      }

      // Don't rethrow the error if it's an abort error
      if (
        !(
          error instanceof DOMException &&
          (error.name === "AbortError" || error.name === "TimeoutError")
        )
      ) {
        throw error;
      }
    } finally {
      // Clean up resources
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      setIsLoadingConversations(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (userId: string, page = 1) => {
    if (!isSignedIn) return;

    setIsLoadingMessages(true);

    // Use the same AbortController pattern as fetchConversations
    let timeoutId: NodeJS.Timeout | null = null;
    const controller = new AbortController();

    try {
      // Create a timeout that adds a reason to the abort
      timeoutId = setTimeout(() => {
        controller.abort(new DOMException("Timeout exceeded", "TimeoutError"));
      }, 10000); // 10 second timeout

      const timestamp = new Date().getTime();
      const response = await fetch(`/api/messages/${userId}?page=${page}&limit=50&_=${timestamp}`, {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      // Clear the timeout as soon as the response is received
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();

      if (page === 1) {
        setMessages(data.messages || []);
      } else {
        setMessages((prev) => [...prev, ...(data.messages || [])]);
      }

      setHasMoreMessages(data.pagination?.hasMore || false);
      setMessagesPage(page);
      setActiveConversation(userId);

      // Update unread count in conversations
      if (data.messages && data.messages.length > 0) {
        setConversations((prev) =>
          prev.map((conv) => (conv.userId === userId ? { ...conv, unreadCount: 0 } : conv))
        );
      }
    } catch (error: any) {
      // Don't log abort errors as they're expected when navigating away
      if (
        !(
          error instanceof DOMException &&
          (error.name === "AbortError" || error.name === "TimeoutError")
        )
      ) {
        console.error("Error fetching messages:", error);
      }

      // Only show toast error if it's not an abort error or if it's a timeout
      if (
        !(error instanceof DOMException && error.name === "AbortError") ||
        (error instanceof DOMException && error.message === "Timeout exceeded")
      ) {
        // Prevent multiple identical toasts
        toast.dismiss();

        // Show a more specific message for timeouts
        if (error instanceof DOMException && error.message === "Timeout exceeded") {
          toast.error("Request timed out. Please try again later.", {
            id: "messages-timeout-error",
            duration: 3000,
          });
        } else {
          toast.error("Failed to load messages", {
            id: "messages-error",
            duration: 3000,
          });
        }
      }
    } finally {
      // Clean up resources
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      setIsLoadingMessages(false);
    }
  };

  // Send a message
  const sendMessage = async (userId: string, content: string, attachments: Attachment[] = []) => {
    if (!isSignedIn || !content.trim()) return;

    setIsSendingMessage(true);

    try {
      const response = await fetch(`/api/messages/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          attachments,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Add the new message to the messages list
      setMessages((prev) => [data.message, ...prev]);

      // Update the conversation list
      const now = new Date().toISOString();
      const existingConversationIndex = conversations.findIndex((c) => c.userId === userId);

      if (existingConversationIndex >= 0) {
        // Update existing conversation
        const updatedConversations = [...conversations];
        updatedConversations[existingConversationIndex] = {
          ...updatedConversations[existingConversationIndex],
          lastMessage: content,
          lastMessageAt: now,
          lastMessageId: data.message.id,
        };

        // Move the conversation to the top
        const conversation = updatedConversations.splice(existingConversationIndex, 1)[0];
        updatedConversations.unshift(conversation);

        setConversations(updatedConversations);
      } else {
        // Create a new conversation
        const newConversation: Conversation = {
          userId,
          username: data.message.recipient.username,
          name: data.message.recipient.name,
          image: data.message.recipient.image,
          lastMessage: content,
          lastMessageAt: now,
          lastMessageId: data.message.id,
          unreadCount: 0,
        };

        setConversations([newConversation, ...conversations]);
      }

      return data.message;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      throw error;
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Mark a message as read
  const markMessageAsRead = async (messageId: string) => {
    if (!isSignedIn) return;

    try {
      const response = await fetch(`/api/messages/read/${messageId}`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to mark message as read");
      }

      // Update the message in the messages list
      setMessages((prev) =>
        prev.map((message) => (message.id === messageId ? { ...message, isRead: true } : message))
      );

      // Update unread count in conversations if active conversation is set
      if (activeConversation) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.userId === activeConversation ? { ...conv, unreadCount: 0 } : conv
          )
        );
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
      // Don't show toast for this error as it's not critical
    }
  };

  // Get total unread count
  const getUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  };

  const value = {
    conversations,
    activeConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSendingMessage,
    hasMoreMessages,
    messagesPage,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markMessageAsRead,
    setActiveConversation,
    getUnreadCount,
  };

  return <DirectMessageContext.Provider value={value}>{children}</DirectMessageContext.Provider>;
}

export function useDirectMessages() {
  const context = useContext(DirectMessageContext);
  if (context === undefined) {
    throw new Error("useDirectMessages must be used within a DirectMessageProvider");
  }
  return context;
}
