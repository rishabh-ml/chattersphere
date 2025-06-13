// This is a context provider for the direct messages feature
// It will be replacing the older DirectMessageContext
"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Conversation, Message } from "../types";
import { useMessages } from "../hooks/useMessages";

interface MessagesContextType {
  conversations: Conversation[];
  unreadCount: number;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isLoadingUnreadCount: boolean;
  isSending: boolean;
  currentRecipientId: string | null;
  messages: Message[];
  hasMoreMessages: boolean;
  setCurrentRecipient: (recipientId: string | null) => void;
  sendMessage: (params: { recipientId: string, content: string, attachments?: File[] }) => Promise<Message | null>;
  markAsRead: (senderId: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  loadMoreMessages: () => void;
  refetchConversations: () => void;
  refetchUnreadCount: () => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const messagesHook = useMessages();

  return (
    <MessagesContext.Provider value={messagesHook}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessagesContext() {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error("useMessagesContext must be used within a MessagesProvider");
  }
  return context;
}

// Legacy support for code that still uses the old context
export const useDirectMessages = useMessagesContext;
