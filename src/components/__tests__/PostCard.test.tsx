import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostCard from '../post-card';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn().mockReturnValue('/'),
}));

jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ isSaved: true }),
  })
) as jest.Mock;

describe('PostCard', () => {
  const mockPost = {
    id: 'post-1',
    author: {
      id: 'user-1',
      username: 'testuser',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
    },
    content: 'This is a test post content',
    upvoteCount: 10,
    downvoteCount: 2,
    voteCount: 8,
    commentCount: 5,
    isUpvoted: false,
    isDownvoted: false,
    isSaved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useUser as jest.Mock).mockReturnValue({ isSignedIn: true });
  });

  it('renders post content correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('This is a test post content')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument(); // Vote count
    expect(screen.getByText('5')).toBeInTheDocument(); // Comment count
  });

  it('renders post with community information when provided', () => {
    const postWithCommunity = {
      ...mockPost,
      community: {
        id: 'community-1',
        name: 'Test Community',
        image: 'https://example.com/community.jpg',
      },
    };

    render(<PostCard post={postWithCommunity} />);

    expect(screen.getByText('Test Community')).toBeInTheDocument();
  });

  it('shows upvoted state when post is upvoted', () => {
    const upvotedPost = {
      ...mockPost,
      isUpvoted: true,
    };

    render(<PostCard post={upvotedPost} />);

    // Check if the upvote button has the active class
    const upvoteButton = screen.getByLabelText('Upvote');
    expect(upvoteButton).toHaveClass('text-[#00AEEF]');
  });

  it('shows downvoted state when post is downvoted', () => {
    const downvotedPost = {
      ...mockPost,
      isDownvoted: true,
    };

    render(<PostCard post={downvotedPost} />);

    // Check if the downvote button has the active class
    const downvoteButton = screen.getByLabelText('Downvote');
    expect(downvoteButton).toHaveClass('text-red-500');
  });

  it('shows saved state when post is saved', () => {
    const savedPost = {
      ...mockPost,
      isSaved: true,
    };

    render(<PostCard post={savedPost} />);

    // Check if the save button has the active class
    const saveButton = screen.getByLabelText('Save');
    expect(saveButton).toHaveClass('text-[#00AEEF]');
  });





  it('navigates to post detail page when clicked', () => {
    render(<PostCard post={mockPost} />);

    // Find the post card container
    const postCard = screen.getByTestId('post-card');
    fireEvent.click(postCard);

    // Check if router.push was called with the correct path
    expect(mockRouter.push).toHaveBeenCalled();
  });

  it('navigates to post detail page when clicking on content', () => {
    render(<PostCard post={mockPost} />);

    const contentElement = screen.getByText('This is a test post content');
    fireEvent.click(contentElement);

    expect(mockRouter.push).toHaveBeenCalledWith(`/posts/${mockPost.id}`);
  });

  it('navigates to author profile when clicking on author name', () => {
    render(<PostCard post={mockPost} />);

    const authorElement = screen.getByText('Test User');
    fireEvent.click(authorElement);

    expect(mockRouter.push).toHaveBeenCalledWith(`/profile/${mockPost.author.id}`);
  });

  it('navigates to community page when clicking on community name', () => {
    const postWithCommunity = {
      ...mockPost,
      community: {
        id: 'community-1',
        name: 'Test Community',
        image: 'https://example.com/community.jpg',
      },
    };

    render(<PostCard post={postWithCommunity} />);

    const communityElement = screen.getByText('Test Community');
    fireEvent.click(communityElement);

    expect(mockRouter.push).toHaveBeenCalledWith(`/community/${postWithCommunity.community.id}`);
  });

  it('truncates long content with "Read more" button', () => {
    const longContent = 'a'.repeat(300);
    const postWithLongContent = {
      ...mockPost,
      content: longContent,
    };

    render(<PostCard post={postWithLongContent} />);

    expect(screen.getByText(/^a+/)).toBeInTheDocument();
    expect(screen.getByText('Read more')).toBeInTheDocument();

    // Click "Read more" button
    fireEvent.click(screen.getByText('Read more'));

    // Content should now be fully displayed
    expect(screen.getByText(longContent)).toBeInTheDocument();
    expect(screen.queryByText('Read more')).not.toBeInTheDocument();
  });

  it('renders author information correctly', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/testuser/)).toBeInTheDocument();
  });

  it('formats the post date correctly', () => {
    render(<PostCard post={mockPost} />);

    // The actual formatted date will depend on the implementation
    // This is a simplified test that just checks if some date is shown
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('handles post with media content', () => {
    const postWithMedia = {
      ...mockPost,
      mediaUrls: ['https://example.com/image1.jpg'],
    };

    render(<PostCard post={postWithMedia} />);

    // Just check if the image container is rendered
    const mediaContainer = screen.getByTestId('post-media-container');
    expect(mediaContainer).toBeInTheDocument();
  });
});
