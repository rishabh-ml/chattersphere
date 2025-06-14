import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useUser } from "@clerk/nextjs";
import PostCard from "../post-card";
import { toast } from "sonner";

// Mock dependencies
jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockPost = {
  id: "post_123",
  content: "This is a test post content",
  author: {
    id: "author_123",
    username: "testuser",
    name: "Test User",
    image: "https://example.com/avatar.jpg",
  },
  upvoteCount: 5,
  downvoteCount: 1,
  commentCount: 3,
  voteCount: 4,
  isUpvoted: false,
  isDownvoted: false,
  createdAt: "2023-01-01T00:00:00.000Z",
  updatedAt: "2023-01-01T00:00:00.000Z",
};

const mockUser = {
  id: "user_123",
  username: "currentuser",
  firstName: "Current",
  lastName: "User",
  imageUrl: "https://example.com/current-avatar.jpg",
};

describe("PostCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: mockUser,
    });
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  it("renders post content correctly", () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.getByText("This is a test post content")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
  });

  it("displays vote counts correctly", () => {
    render(<PostCard post={mockPost} />);
    
    expect(screen.getByText("5")).toBeInTheDocument(); // upvote count
    expect(screen.getByText("1")).toBeInTheDocument(); // downvote count
    expect(screen.getByText("3")).toBeInTheDocument(); // comment count
  });

  it("handles upvote action", async () => {
    render(<PostCard post={mockPost} />);
    
    const upvoteButton = screen.getByLabelText(/upvote/i);
    fireEvent.click(upvoteButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/posts/post_123/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType: "upvote" }),
      });
    });
  });

  it("handles downvote action", async () => {
    render(<PostCard post={mockPost} />);
    
    const downvoteButton = screen.getByLabelText(/downvote/i);
    fireEvent.click(downvoteButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/posts/post_123/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType: "downvote" }),
      });
    });
  });

  it("shows error when vote fails", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Vote failed" }),
    });

    render(<PostCard post={mockPost} />);
    
    const upvoteButton = screen.getByLabelText(/upvote/i);
    fireEvent.click(upvoteButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Vote failed");
    });
  });

  it("disables vote buttons when user is not signed in", () => {
    (useUser as jest.Mock).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    });

    render(<PostCard post={mockPost} />);
    
    const upvoteButton = screen.getByLabelText(/upvote/i);
    const downvoteButton = screen.getByLabelText(/downvote/i);
    
    expect(upvoteButton).toBeDisabled();
    expect(downvoteButton).toBeDisabled();
  });

  it("shows loading state when user data is not loaded", () => {
    (useUser as jest.Mock).mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
      user: null,
    });

    render(<PostCard post={mockPost} />);
    
    expect(screen.getByTestId("post-loading")).toBeInTheDocument();
  });

  it("formats creation date correctly", () => {
    render(<PostCard post={mockPost} />);
    
    // Should show relative time like "Jan 1, 2023"
    expect(screen.getByText(/Jan 1, 2023/i)).toBeInTheDocument();
  });
});
