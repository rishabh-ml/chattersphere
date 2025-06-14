// Types for the Notifications feature

export enum NotificationType {
  POST_MENTION = "POST_MENTION",
  COMMENT_MENTION = "COMMENT_MENTION",
  COMMENT_REPLY = "COMMENT_REPLY",
  POST_UPVOTE = "POST_UPVOTE",
  COMMENT_UPVOTE = "COMMENT_UPVOTE",
  NEW_FOLLOWER = "NEW_FOLLOWER",
  COMMUNITY_INVITE = "COMMUNITY_INVITE",
  COMMUNITY_ROLE_CHANGE = "COMMUNITY_ROLE_CHANGE",
  DIRECT_MESSAGE = "DIRECT_MESSAGE",
  SYSTEM_NOTIFICATION = "SYSTEM_NOTIFICATION",
}

export interface NotificationActor {
  id: string;
  name: string;
  username: string;
  image?: string;
}

export interface NotificationTarget {
  id: string;
  type: "post" | "comment" | "user" | "community" | "message" | "system";
  title?: string;
  content?: string;
  url?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  actor?: NotificationActor; // Person who triggered the notification
  target: NotificationTarget; // The object the notification is about
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface NotificationPreferences {
  allowPushNotifications: boolean;
  allowEmailNotifications: boolean;
  emailDigestFrequency: "none" | "daily" | "weekly";
  mutedTypes: NotificationType[];
  mutedUsers: string[];
  mutedCommunities: string[];
}
