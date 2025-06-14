import { Notification, NotificationPreferences, PaginatedNotifications } from "../types";
import { ApiClient } from "@/shared/services/apiClient";

/**
 * Service for handling notifications
 */
export class NotificationsService {
  /**
   * Get current user's notifications
   * @param cursor Optional pagination cursor
   * @param limit Optional limit on number of notifications
   * @returns Paginated notifications
   */
  static async getNotifications(
    cursor?: string,
    limit: number = 20
  ): Promise<PaginatedNotifications> {
    try {
      const params = new URLSearchParams();
      if (cursor) params.append("cursor", cursor);
      if (limit) params.append("limit", limit.toString());

      const response = await ApiClient.get<PaginatedNotifications>(
        `/api/notifications?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return { notifications: [], hasMore: false };
    }
  }

  /**
   * Get unread notifications count
   * @returns Number of unread notifications
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const response = await ApiClient.get<{ count: number }>("/api/notifications/unread");
      return response.count;
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   * @param notificationId ID of notification to mark as read
   * @returns Success status
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await ApiClient.put(`/api/notifications/${notificationId}/read`, {});
      return true;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   * @returns Success status
   */
  static async markAllAsRead(): Promise<boolean> {
    try {
      await ApiClient.put("/api/notifications/read-all", {});
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  /**
   * Delete a notification
   * @param notificationId ID of notification to delete
   * @returns Success status
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await ApiClient.delete(`/api/notifications/${notificationId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      return false;
    }
  }

  /**
   * Get notification preferences
   * @returns User's notification preferences
   */
  static async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await ApiClient.get<{ preferences: NotificationPreferences }>(
        "/api/notifications/preferences"
      );
      return response.preferences;
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   * @param preferences Updated preferences
   * @returns Updated preferences
   */
  static async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const response = await ApiClient.patch<{ preferences: NotificationPreferences }>(
        "/api/notifications/preferences",
        preferences
      );
      return response.preferences;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  }
}
