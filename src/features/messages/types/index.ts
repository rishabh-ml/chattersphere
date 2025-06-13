// Types for the Messages feature
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

export interface DirectMessage extends Message {
  recipient: MessageSender;
}

export interface ChannelMessage extends Message {
  channel: string;
  community: string;
  mentions?: MessageSender[];
  reactions?: MessageReaction[];
  replyTo?: string;
  isEdited: boolean;
  isPinned: boolean;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Conversation {
  id: string;
  participant: MessageSender;
  lastMessage: Message;
  unreadCount: number;
}

export interface MessageFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  hasAttachments?: boolean;
}

export interface PaginatedMessages {
  messages: Message[];
  nextCursor?: string;
  hasMore: boolean;
}
