import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommunityJoinButton from '../CommunityJoinButton';
import { useCommunityActions } from '@/hooks/useCommunityActions';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/hooks/useCommunityActions', () => ({
  useCommunityActions: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CommunityJoinButton', () => {
  const mockCommunity = {
    id: 'community-1',
    name: 'Test Community',
    slug: 'test-community',
    description: 'A test community',
    memberCount: 10,
    postCount: 5,
    isMember: false,
    isCreator: false,
    isModerator: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockJoinCommunity = jest.fn();
  const mockLeaveCommunity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (useCommunityActions as jest.Mock).mockReturnValue({
      joinCommunity: mockJoinCommunity,
      leaveCommunity: mockLeaveCommunity,
      isJoining: false,
      isLeaving: false,
    });
  });

  it('renders Join button when user is not a member', () => {
    render(<CommunityJoinButton community={{ ...mockCommunity, isMember: false }} />);
    
    const joinButton = screen.getByRole('button', { name: /join/i });
    expect(joinButton).toBeInTheDocument();
    expect(joinButton).toHaveTextContent('Join Community');
  });

  it('renders Leave button when user is a member', () => {
    render(<CommunityJoinButton community={{ ...mockCommunity, isMember: true }} />);
    
    const leaveButton = screen.getByRole('button', { name: /leave/i });
    expect(leaveButton).toBeInTheDocument();
    expect(leaveButton).toHaveTextContent('Leave Community');
  });

  it('disables button and shows loading state when joining', () => {
    // Mock loading state
    (useCommunityActions as jest.Mock).mockReturnValue({
      joinCommunity: mockJoinCommunity,
      leaveCommunity: mockLeaveCommunity,
      isJoining: true,
      isLeaving: false,
    });
    
    render(<CommunityJoinButton community={{ ...mockCommunity, isMember: false }} />);
    
    const joinButton = screen.getByRole('button', { name: /join/i });
    expect(joinButton).toBeDisabled();
    expect(joinButton).toHaveTextContent('Joining...');
  });

  it('disables button and shows loading state when leaving', () => {
    // Mock loading state
    (useCommunityActions as jest.Mock).mockReturnValue({
      joinCommunity: mockJoinCommunity,
      leaveCommunity: mockLeaveCommunity,
      isJoining: false,
      isLeaving: true,
    });
    
    render(<CommunityJoinButton community={{ ...mockCommunity, isMember: true }} />);
    
    const leaveButton = screen.getByRole('button', { name: /leave/i });
    expect(leaveButton).toBeDisabled();
    expect(leaveButton).toHaveTextContent('Leaving...');
  });

  it('calls joinCommunity when Join button is clicked', async () => {
    render(<CommunityJoinButton community={{ ...mockCommunity, isMember: false }} />);
    
    const joinButton = screen.getByRole('button', { name: /join/i });
    fireEvent.click(joinButton);
    
    expect(mockJoinCommunity).toHaveBeenCalledWith('community-1');
    expect(mockJoinCommunity).toHaveBeenCalledTimes(1);
  });

  it('calls leaveCommunity when Leave button is clicked', async () => {
    render(<CommunityJoinButton community={{ ...mockCommunity, isMember: true }} />);
    
    const leaveButton = screen.getByRole('button', { name: /leave/i });
    fireEvent.click(leaveButton);
    
    expect(mockLeaveCommunity).toHaveBeenCalledWith('community-1');
    expect(mockLeaveCommunity).toHaveBeenCalledTimes(1);
  });

  it('shows success toast when joining is successful', async () => {
    // Mock successful join
    mockJoinCommunity.mockResolvedValue({ success: true });
    
    render(<CommunityJoinButton community={{ ...mockCommunity, isMember: false }} />);
    
    const joinButton = screen.getByRole('button', { name: /join/i });
    fireEvent.click(joinButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Successfully joined Test Community');
    });
  });

  it('shows error toast when joining fails', async () => {
    // Mock failed join
    mockJoinCommunity.mockRejectedValue(new Error('Failed to join'));
    
    render(<CommunityJoinButton community={{ ...mockCommunity, isMember: false }} />);
    
    const joinButton = screen.getByRole('button', { name: /join/i });
    fireEvent.click(joinButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to join community');
    });
  });

  it('shows success toast when leaving is successful', async () => {
    // Mock successful leave
    mockLeaveCommunity.mockResolvedValue({ success: true });
    
    render(<CommunityJoinButton community={{ ...mockCommunity, isMember: true }} />);
    
    const leaveButton = screen.getByRole('button', { name: /leave/i });
    fireEvent.click(leaveButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Successfully left Test Community');
    });
  });

  it('shows error toast when leaving fails', async () => {
    // Mock failed leave
    mockLeaveCommunity.mockRejectedValue(new Error('Failed to leave'));
    
    render(<CommunityJoinButton community={{ ...mockCommunity, isMember: true }} />);
    
    const leaveButton = screen.getByRole('button', { name: /leave/i });
    fireEvent.click(leaveButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to leave community');
    });
  });

  it('does not render button if user is the creator', () => {
    render(<CommunityJoinButton community={{ ...mockCommunity, isCreator: true }} />);
    
    expect(screen.queryByRole('button', { name: /join/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /leave/i })).not.toBeInTheDocument();
  });
});
