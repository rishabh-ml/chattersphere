import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConversationView from "@/components/messages/ConversationView";
import { useDirectMessages } from "@/context/DirectMessageContext";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// Mock the hooks
jest.mock("@/context/DirectMessageContext", () => ({
  useDirectMessages: jest.fn(),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("ConversationView", () => {
  const mockMessages = [
    {
      id: "message1",
      content: "Hello there!",
      sender: {
        id: "user1",
        username: "user1",
        name: "User 1",
        image: "https://example.com/user1.jpg",
      },
      attachments: [],
      isRead: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "message2",
      content: "Hi! How are you?",
      sender: {
        id: "user2",
        username: "user2",
        name: "User 2",
        image: "https://example.com/user2.jpg",
      },
      attachments: [],
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockFetchMessages = jest.fn();
  const mockSendMessage = jest.fn();
  const mockMarkMessageAsRead = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useDirectMessages
    (useDirectMessages as jest.Mock).mockReturnValue({
      messages: mockMessages,
      isLoadingMessages: false,
      isSendingMessage: false,
      hasMoreMessages: false,
      messagesPage: 1,
      fetchMessages: mockFetchMessages,
      sendMessage: mockSendMessage,
      markMessageAsRead: mockMarkMessageAsRead,
    });

    // Mock useUser
    (useUser as jest.Mock).mockReturnValue({
      user: {
        id: "user1",
      },
      isSignedIn: true,
    });

    // Mock useRouter
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
  });

  it("renders the conversation view with messages", () => {
    render(<ConversationView userId="user2" userName="User 2" />);

    // Check if the user name is displayed
    expect(screen.getByText("User 2")).toBeInTheDocument();

    // Check if messages are displayed
    expect(screen.getByText("Hello there!")).toBeInTheDocument();
    expect(screen.getByText("Hi! How are you?")).toBeInTheDocument();

    // Check if the message input is displayed
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
  });

  it("fetches messages when mounted", () => {
    render(<ConversationView userId="user2" userName="User 2" />);

    expect(mockFetchMessages).toHaveBeenCalledWith("user2");
  });

  it("marks unread messages as read", () => {
    render(<ConversationView userId="user2" userName="User 2" />);

    expect(mockMarkMessageAsRead).toHaveBeenCalledWith("message2");
  });

  it("sends a message when the send button is clicked", async () => {
    render(<ConversationView userId="user2" userName="User 2" />);

    // Type a message
    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(input, { target: { value: "New message" } });

    // Click the send button
    const sendButton = screen.getByRole("button", { name: "" }); // The send button has no text, only an icon
    fireEvent.click(sendButton);

    // Check if the sendMessage function was called
    expect(mockSendMessage).toHaveBeenCalledWith("user2", "New message");
  });

  it("shows loading state when fetching messages", () => {
    (useDirectMessages as jest.Mock).mockReturnValue({
      messages: [],
      isLoadingMessages: true,
      isSendingMessage: false,
      hasMoreMessages: false,
      messagesPage: 1,
      fetchMessages: mockFetchMessages,
      sendMessage: mockSendMessage,
      markMessageAsRead: mockMarkMessageAsRead,
    });

    render(<ConversationView userId="user2" userName="User 2" />);

    // Check if loading indicator is displayed
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows load more button when there are more messages", () => {
    (useDirectMessages as jest.Mock).mockReturnValue({
      messages: mockMessages,
      isLoadingMessages: false,
      isSendingMessage: false,
      hasMoreMessages: true,
      messagesPage: 1,
      fetchMessages: mockFetchMessages,
      sendMessage: mockSendMessage,
      markMessageAsRead: mockMarkMessageAsRead,
    });

    render(<ConversationView userId="user2" userName="User 2" />);

    // Check if load more button is displayed
    expect(screen.getByText("Load older messages")).toBeInTheDocument();
  });
});
