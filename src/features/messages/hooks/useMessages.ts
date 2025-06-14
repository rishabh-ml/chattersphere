import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { MessagesService } from "../services/messagesService";
import { Conversation, Message, MessageFilters } from "../types";
import { useState } from "react";

/**
 * Hook for managing messages and conversations
 */
export function useMessages() {
  const queryClient = useQueryClient();
  const [currentRecipientId, setCurrentRecipientId] = useState<string | null>(null);

  // Get all conversations for the current user
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => MessagesService.getConversations(),
  });
  // Get messages for a specific conversation
  const {
    data: conversationData,
    isLoading: isLoadingMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["messages", currentRecipientId],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      MessagesService.getMessages(currentRecipientId!, pageParam),
    enabled: !!currentRecipientId,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: undefined,
  });

  // Get unread messages count
  const {
    data: unreadCount = 0,
    isLoading: isLoadingUnreadCount,
    refetch: refetchUnreadCount,
  } = useQuery<number>({
    queryKey: ["unreadCount"],
    queryFn: () => MessagesService.getUnreadCount(),
  });

  // Send a message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({
      recipientId,
      content,
      attachments = [],
    }: {
      recipientId: string;
      content: string;
      attachments?: File[];
    }) => {
      return MessagesService.sendMessage(recipientId, content, attachments);
    },
    onSuccess: () => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (currentRecipientId) {
        queryClient.invalidateQueries({ queryKey: ["messages", currentRecipientId] });
      }
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (senderId: string) => MessagesService.markAsRead(senderId),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      if (currentRecipientId) {
        queryClient.invalidateQueries({ queryKey: ["messages", currentRecipientId] });
      }
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => MessagesService.deleteMessage(messageId),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (currentRecipientId) {
        queryClient.invalidateQueries({ queryKey: ["messages", currentRecipientId] });
      }
    },
  });

  // Search messages
  const searchMessagesMutation = useMutation({
    mutationFn: (filters: MessageFilters) => MessagesService.searchMessages(filters),
  });
  return {
    // Data
    conversations,
    messages: conversationData?.pages?.flatMap((page) => page.messages) || [],
    hasMoreMessages: hasNextPage,
    unreadCount,

    // Loading states
    isLoadingConversations,
    isLoadingMessages,
    isLoadingUnreadCount,
    isFetchingNextPage,

    // Actions
    setCurrentRecipient: setCurrentRecipientId,
    sendMessage: sendMessageMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,
    searchMessages: searchMessagesMutation.mutateAsync,
    loadMoreMessages: fetchNextPage,

    // Refetch functions
    refetchConversations,
    refetchUnreadCount,

    // Additional states
    isSending: sendMessageMutation.isPending,
    currentRecipientId,
  };
}
