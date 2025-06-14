import { Conversation, DirectMessage, Message, MessageFilters } from "../types";
import { ApiClient } from "@/shared/services/apiClient";

/**
 * Service class for handling direct messages and conversations
 */
export class MessagesService {
  /**
   * Get all conversations for the current user
   * @returns List of conversations
   */
  static async getConversations(): Promise<Conversation[]> {
    try {
      const response = await ApiClient.get<{ conversations: Conversation[] }>(
        "/api/messages/conversations"
      );
      return response.conversations;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  }

  /**
   * Get messages between the current user and a specific recipient
   * @param recipientId ID of the other participant in the conversation
   * @param cursor Optional cursor for pagination
   * @param limit Optional limit for number of messages
   * @returns Messages and pagination info
   */
  static async getMessages(
    recipientId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<{ messages: Message[]; nextCursor?: string; hasMore: boolean }> {
    try {
      const params = new URLSearchParams();
      if (cursor) params.append("cursor", cursor);
      if (limit) params.append("limit", limit.toString());

      const response = await ApiClient.get<{
        messages: Message[];
        nextCursor?: string;
        hasMore: boolean;
      }>(`/api/messages/${recipientId}?${params.toString()}`);
      return response;
    } catch (error) {
      console.error(`Error fetching messages with user ${recipientId}:`, error);
      return { messages: [], hasMore: false };
    }
  }

  /**
   * Send a message to a recipient
   * @param recipientId ID of the recipient user
   * @param content Text content of the message
   * @param attachments Optional file attachments
   * @returns The sent message if successful
   */
  static async sendMessage(
    recipientId: string,
    content: string,
    attachments: File[] = []
  ): Promise<Message | null> {
    try {
      // Handle attachments first if any
      let attachmentData: Array<{ url: string; type: string; name: string; size: number }> = [];

      if (attachments.length > 0) {
        // Upload attachments and get their details
        const formData = new FormData();
        attachments.forEach((file) => formData.append("files", file));

        const uploadResponse = await ApiClient.post<{
          files: Array<{ url: string; type: string; name: string; size: number }>;
        }>("/api/upload", formData);
        attachmentData = uploadResponse.files;
      }

      const response = await ApiClient.post<{ message: Message }>(`/api/messages/${recipientId}`, {
        content,
        attachments: attachmentData,
      });

      return response.message;
    } catch (error) {
      console.error("Error sending message:", error);
      return null;
    }
  }

  /**
   * Mark all messages from a sender as read
   * @param senderId ID of the sender user
   * @returns Success status
   */
  static async markAsRead(senderId: string): Promise<boolean> {
    try {
      await ApiClient.put(`/api/messages/${senderId}/read`, {});
      return true;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return false;
    }
  }

  /**
   * Get unread messages count
   * @returns Number of unread messages
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const response = await ApiClient.get<{ count: number }>("/api/messages/unread");
      return response.count;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  }

  /**
   * Delete a specific message
   * @param messageId ID of the message to delete
   * @returns Success status
   */
  static async deleteMessage(messageId: string): Promise<boolean> {
    try {
      await ApiClient.delete(`/api/messages/message/${messageId}`);
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      return false;
    }
  }

  /**
   * Search messages using filters
   * @param filters Search filters
   * @returns Filtered messages
   */
  static async searchMessages(filters: MessageFilters): Promise<Message[]> {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.hasAttachments !== undefined)
        params.append("hasAttachments", filters.hasAttachments.toString());

      const response = await ApiClient.get<{ messages: Message[] }>(
        `/api/messages/search?${params.toString()}`
      );
      return response.messages;
    } catch (error) {
      console.error("Error searching messages:", error);
      return [];
    }
  }
}
