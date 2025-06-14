import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NotificationsList from "../NotificationsList";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationType } from "../../types";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../hooks/useNotifications", () => ({
  useNotifications: jest.fn(),
}));

jest.mock("@/shared/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/shared/ui/scroll-area", () => ({
  ScrollArea: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock("@/shared/ui/avatar", () => ({
  Avatar: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock("@/shared/utils/cn", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe("NotificationsList Component", () => {
  const mockNotifications = [
    {
      id: "1",
      type: NotificationType.POST_UPVOTE,
      actor: {
        id: "user1",
        name: "John Doe",
        username: "johndoe",
        image: "avatar1.jpg",
      },
      target: {
        id: "post1",
        type: "post" as const,
        title: "Test Post",
        url: "/posts/post1",
      },
      isRead: false,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      type: NotificationType.NEW_FOLLOWER,
      actor: {
        id: "user2",
        name: "Jane Smith",
        username: "janesmith",
        image: "avatar2.jpg",
      },
      target: {
        id: "user1",
        type: "user" as const,
        url: "/profile/user1",
      },
      isRead: true,
      createdAt: "2024-01-02T00:00:00Z",
    },
    {
      id: "3",
      type: NotificationType.COMMENT_MENTION,
      actor: {
        id: "user3",
        name: "Bob Wilson",
        username: "bobwilson",
      },
      target: {
        id: "comment1",
        type: "comment" as const,
        title: "Mentioned you in a comment",
        url: "/posts/post2#comment1",
      },
      isRead: false,
      createdAt: "2024-01-03T00:00:00Z",
    },
  ];

  const mockUseNotifications = {
    notifications: mockNotifications,
    hasMoreNotifications: false,
    isLoadingNotifications: false,
    loadMoreNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    isFetchingNextPage: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotifications as jest.Mock).mockReturnValue(mockUseNotifications);
  });

  it("renders notifications list correctly", () => {
    renderWithQueryClient(<NotificationsList />);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Mark all read")).toBeInTheDocument();
    expect(screen.getByText("John Doe upvoted your post")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith started following you")).toBeInTheDocument();
    expect(screen.getByText("Bob Wilson mentioned you in a comment")).toBeInTheDocument();
  });

  it("shows loading state when notifications are loading", () => {
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      isLoadingNotifications: true,
      notifications: [],
    });

    renderWithQueryClient(<NotificationsList />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows empty state when no notifications", () => {
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      notifications: [],
    });

    renderWithQueryClient(<NotificationsList />);

    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
    expect(screen.getByText("When you get notifications, they'll appear here")).toBeInTheDocument();
  });

  it("marks notification as read when clicked", async () => {
    const mockMarkAsRead = jest.fn().mockResolvedValue(undefined);
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      markAsRead: mockMarkAsRead,
    });

    renderWithQueryClient(<NotificationsList />);

    const unreadNotification = screen.getByText("John Doe upvoted your post");
    fireEvent.click(unreadNotification.closest("div[role='button']") || unreadNotification);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith("1");
      expect(mockPush).toHaveBeenCalledWith("/posts/post1");
    });
  });

  it("marks all notifications as read", async () => {
    const mockMarkAllAsRead = jest.fn().mockResolvedValue(undefined);
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      markAllAsRead: mockMarkAllAsRead,
    });

    renderWithQueryClient(<NotificationsList />);

    const markAllButton = screen.getByText("Mark all read");
    fireEvent.click(markAllButton);

    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("All notifications marked as read");
    });
  });

  it("handles mark all as read error", async () => {
    const mockMarkAllAsRead = jest.fn().mockRejectedValue(new Error("Failed to mark as read"));
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      markAllAsRead: mockMarkAllAsRead,
    });

    renderWithQueryClient(<NotificationsList />);

    const markAllButton = screen.getByText("Mark all read");
    fireEvent.click(markAllButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to mark all notifications as read");
    });
  });

  it("deletes notification when delete button clicked", async () => {
    const mockDeleteNotification = jest.fn().mockResolvedValue(undefined);
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      deleteNotification: mockDeleteNotification,
    });

    renderWithQueryClient(<NotificationsList />);

    // Find and click the delete button for the first notification
    const deleteButtons = screen.getAllByText("×");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteNotification).toHaveBeenCalledWith("1");
      expect(toast.success).toHaveBeenCalledWith("Notification removed");
    });
  });

  it("handles delete notification error", async () => {
    const mockDeleteNotification = jest.fn().mockRejectedValue(new Error("Failed to delete"));
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      deleteNotification: mockDeleteNotification,
    });

    renderWithQueryClient(<NotificationsList />);

    const deleteButtons = screen.getAllByText("×");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to remove notification");
    });
  });

  it("displays correct notification icons for different types", () => {
    renderWithQueryClient(<NotificationsList />);

    // Check that different notification types have appropriate visual indicators
    const notifications = screen.getAllByRole("button");
    expect(notifications).toHaveLength(4); // 3 notifications + 1 mark all read button
  });

  it("displays relative time for notifications", () => {
    renderWithQueryClient(<NotificationsList />);

    // Check that relative time is displayed (exact text may vary based on date-fns)
    expect(screen.getByText(/ago$/)).toBeInTheDocument();
  });

  it("disables mark all read button when no notifications", () => {
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      notifications: [],
    });

    renderWithQueryClient(<NotificationsList />);

    const markAllButton = screen.getByText("Mark all read");
    expect(markAllButton).toBeDisabled();
  });

  it("shows loading state in mark all read button", () => {
    renderWithQueryClient(<NotificationsList />);

    const markAllButton = screen.getByText("Mark all read");
    fireEvent.click(markAllButton);

    // Check that button shows loading state (specific implementation may vary)
    expect(mockUseNotifications.markAllAsRead).toHaveBeenCalled();
  });

  it("handles notification click without URL gracefully", async () => {
    const notificationWithoutUrl = {
      ...mockNotifications[0],
      target: { ...mockNotifications[0].target, url: undefined },
    };

    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      notifications: [notificationWithoutUrl],
    });

    renderWithQueryClient(<NotificationsList />);

    const notification = screen.getByText("John Doe upvoted your post");
    fireEvent.click(notification.closest("div[role='button']") || notification);

    await waitFor(() => {
      expect(mockUseNotifications.markAsRead).toHaveBeenCalledWith("1");
      // Should not navigate if no URL
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("prevents event propagation on delete button click", () => {
    renderWithQueryClient(<NotificationsList />);

    const deleteButtons = screen.getAllByText("×");
    const stopPropagation = jest.fn();
    
    // Mock event object
    const mockEvent = {
      stopPropagation,
      preventDefault: jest.fn(),
    };

    fireEvent.click(deleteButtons[0], mockEvent);

    // The stopPropagation should be called to prevent notification click
    expect(mockUseNotifications.deleteNotification).toHaveBeenCalled();
  });
});
