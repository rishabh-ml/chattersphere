import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileHeader from '../ProfileHeader';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isSignedIn: true,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ProfileHeader', () => {
  const mockUser = {
    id: '123',
    clerkId: 'clerk_123',
    username: 'testuser',
    name: 'Test User',
    bio: 'This is a test bio',
    image: 'https://example.com/avatar.jpg',
    location: 'Test City',
    website: 'https://example.com',
    followingCount: 10,
    followerCount: 20,
    communityCount: 5,
    isFollowing: false,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockProps = {
    user: mockUser,
    isOwner: false,
    onAvatarUpload: jest.fn(),
    onFollowToggle: jest.fn(),
    followLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user information correctly', () => {
    render(<ProfileHeader {...mockProps} />);

    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(`@${mockUser.username}`)).toBeInTheDocument();
    expect(screen.getByText(mockUser.bio)).toBeInTheDocument();
    expect(screen.getByText(mockUser.location)).toBeInTheDocument();
    expect(screen.getByText(mockUser.website)).toBeInTheDocument();
    expect(screen.getByText(mockUser.followerCount.toString())).toBeInTheDocument();
    expect(screen.getByText(mockUser.followingCount.toString())).toBeInTheDocument();
    expect(screen.getByText(mockUser.communityCount.toString())).toBeInTheDocument();
  });

  it('shows Follow button when not owner and not following', () => {
    render(<ProfileHeader {...mockProps} />);

    const followButton = screen.getByRole('button', { name: /follow/i });
    expect(followButton).toBeInTheDocument();

    fireEvent.click(followButton);
    expect(mockProps.onFollowToggle).toHaveBeenCalledTimes(1);
  });

  it('shows Unfollow button when not owner and following', () => {
    const followingUser = { ...mockUser, isFollowing: true };
    render(<ProfileHeader {...mockProps} user={followingUser} />);

    const unfollowButton = screen.getByRole('button', { name: /unfollow/i });
    expect(unfollowButton).toBeInTheDocument();

    fireEvent.click(unfollowButton);
    expect(mockProps.onFollowToggle).toHaveBeenCalledTimes(1);
  });

  it('shows Edit Profile button when owner', () => {
    render(<ProfileHeader {...mockProps} isOwner={true} />);

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    expect(editButton).toBeInTheDocument();
  });

  it('allows avatar upload when owner', async () => {
    render(<ProfileHeader {...mockProps} isOwner={true} />);

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/upload avatar/i);

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockProps.onAvatarUpload).toHaveBeenCalledWith(file);
    });
  });

  it('validates file type during avatar upload', async () => {
    render(<ProfileHeader {...mockProps} isOwner={true} />);

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload avatar/i);

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Invalid file type'));
      expect(mockProps.onAvatarUpload).not.toHaveBeenCalled();
    });
  });

  it('validates file size during avatar upload', async () => {
    render(<ProfileHeader {...mockProps} isOwner={true} />);

    // Create a file that's larger than 5MB
    const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    const input = screen.getByLabelText(/upload avatar/i);

    Object.defineProperty(input, 'files', {
      value: [largeFile],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('File too large'));
      expect(mockProps.onAvatarUpload).not.toHaveBeenCalled();
    });
  });
});
