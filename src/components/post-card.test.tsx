import { render, screen, fireEvent } from "@testing-library/react";
import PostCard from "./post-card";
import { type Post } from "@/types";

// Mock the useRouter hook
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => "/",
}));

// Mock the usePostActions hook
jest.mock("@/hooks/usePostActions", () => ({
  usePostActions: () => ({
    upvotePost: jest.fn(),
    downvotePost: jest.fn(),
    savePost: jest.fn(),
    deletePost: jest.fn(),
    isUpvoting: false,
    isDownvoting: false,
    isSaving: false,
    isDeleting: false,
  }),
}));

describe("PostCard", () => {
  const mockPost: Post = {
    id: "post-1",
    author: {
      id: "user-1",
      username: "testuser",
      name: "Test User",
      image: "https://example.com/avatar.jpg",
    },
    content: "This is a test post content",
    upvoteCount: 10,
    downvoteCount: 2,
    voteCount: 8,
    commentCount: 5,
    isUpvoted: false,
    isDownvoted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("renders post content correctly", () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText("This is a test post content")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders post with community information when provided", () => {
    const postWithCommunity: Post = {
      ...mockPost,
      community: {
        id: "community-1",
        name: "Test Community",
        image: "https://example.com/community.jpg",
      },
    };

    render(<PostCard post={postWithCommunity} />);
    expect(screen.getByText("Test Community")).toBeInTheDocument();
  });

  it("shows upvoted state when post is upvoted", () => {
    const upvotedPost: Post = {
      ...mockPost,
      isUpvoted: true,
    };

    render(<PostCard post={upvotedPost} />);
    const upvoteButton = screen.getByLabelText("Upvote");
    expect(upvoteButton).toHaveClass("text-green-500");
  });

  it("shows downvoted state when post is downvoted", () => {
    const downvotedPost: Post = {
      ...mockPost,
      isDownvoted: true,
    };

    render(<PostCard post={downvotedPost} />);
    const downvoteButton = screen.getByLabelText("Downvote");
    expect(downvoteButton).toHaveClass("text-red-500");
  });

  it('truncates long content with "Read more" button', async () => {
    const longContent = "a".repeat(300);
    const postWithLongContent: Post = {
      ...mockPost,
      content: longContent,
    };

    render(<PostCard post={postWithLongContent} />);

    expect(screen.getByText("Read more")).toBeInTheDocument();
    expect(screen.getByText(/^a+/)).toBeInTheDocument();

    const contentElement = screen.getByText(/^a+/);
    expect(contentElement.textContent?.length).toBeLessThan(longContent.length);

    fireEvent.click(screen.getByText("Read more"));
    expect(screen.getByText(longContent)).toBeInTheDocument();
  });
});
