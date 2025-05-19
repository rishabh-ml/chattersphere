import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useNavigation, routes } from '../navigation';
import { useRouter } from 'next/navigation';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn().mockReturnValue('/'),
}));

// Test component that uses the navigation hook
function TestComponent() {
  const navigation = useNavigation();
  
  return (
    <div>
      <button data-testid="profile-btn" onClick={() => navigation.goToProfile('user-123')}>
        Go to Profile
      </button>
      <button data-testid="community-btn" onClick={() => navigation.goToCommunity('test-community')}>
        Go to Community
      </button>
      <button data-testid="post-btn" onClick={() => navigation.goToPost('post-123')}>
        Go to Post
      </button>
      <button data-testid="followers-btn" onClick={() => navigation.goToFollowers('user-123')}>
        Go to Followers
      </button>
      <button data-testid="following-btn" onClick={() => navigation.goToFollowing('user-123')}>
        Go to Following
      </button>
      <button data-testid="channel-btn" onClick={() => navigation.goToChannel('community-slug', 'channel-slug')}>
        Go to Channel
      </button>
      <button data-testid="home-btn" onClick={() => navigation.goToHome()}>
        Go to Home
      </button>
      <button data-testid="popular-btn" onClick={() => navigation.goToPopular()}>
        Go to Popular
      </button>
      <button data-testid="explore-btn" onClick={() => navigation.goToExplore()}>
        Go to Explore
      </button>
      <button data-testid="notifications-btn" onClick={() => navigation.goToNotifications()}>
        Go to Notifications
      </button>
      <button data-testid="saved-btn" onClick={() => navigation.goToSaved()}>
        Go to Saved
      </button>
      <button data-testid="messages-btn" onClick={() => navigation.goToMessages()}>
        Go to Messages
      </button>
      <button data-testid="settings-btn" onClick={() => navigation.goToSettings()}>
        Go to Settings
      </button>
      <button data-testid="help-btn" onClick={() => navigation.goToHelp()}>
        Go to Help
      </button>
      <button data-testid="create-community-btn" onClick={() => navigation.goToCreateCommunity()}>
        Go to Create Community
      </button>
    </div>
  );
}

describe('Navigation Integration', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });
  
  it('should navigate to all routes correctly', () => {
    render(<TestComponent />);
    
    // Test profile navigation
    fireEvent.click(screen.getByTestId('profile-btn'));
    expect(mockPush).toHaveBeenCalledWith('/profile/user-123');
    
    // Test community navigation
    fireEvent.click(screen.getByTestId('community-btn'));
    expect(mockPush).toHaveBeenCalledWith('/communities/test-community');
    
    // Test post navigation
    fireEvent.click(screen.getByTestId('post-btn'));
    expect(mockPush).toHaveBeenCalledWith('/posts/post-123');
    
    // Test followers navigation
    fireEvent.click(screen.getByTestId('followers-btn'));
    expect(mockPush).toHaveBeenCalledWith('/profile/user-123/followers');
    
    // Test following navigation
    fireEvent.click(screen.getByTestId('following-btn'));
    expect(mockPush).toHaveBeenCalledWith('/profile/user-123/following');
    
    // Test channel navigation
    fireEvent.click(screen.getByTestId('channel-btn'));
    expect(mockPush).toHaveBeenCalledWith('/communities/community-slug/channel-slug');
    
    // Test home navigation
    fireEvent.click(screen.getByTestId('home-btn'));
    expect(mockPush).toHaveBeenCalledWith('/home');
    
    // Test popular navigation
    fireEvent.click(screen.getByTestId('popular-btn'));
    expect(mockPush).toHaveBeenCalledWith('/popular');
    
    // Test explore navigation
    fireEvent.click(screen.getByTestId('explore-btn'));
    expect(mockPush).toHaveBeenCalledWith('/explore');
    
    // Test notifications navigation
    fireEvent.click(screen.getByTestId('notifications-btn'));
    expect(mockPush).toHaveBeenCalledWith('/notifications');
    
    // Test saved navigation
    fireEvent.click(screen.getByTestId('saved-btn'));
    expect(mockPush).toHaveBeenCalledWith('/saved');
    
    // Test messages navigation
    fireEvent.click(screen.getByTestId('messages-btn'));
    expect(mockPush).toHaveBeenCalledWith('/messages');
    
    // Test settings navigation
    fireEvent.click(screen.getByTestId('settings-btn'));
    expect(mockPush).toHaveBeenCalledWith('/settings');
    
    // Test help navigation
    fireEvent.click(screen.getByTestId('help-btn'));
    expect(mockPush).toHaveBeenCalledWith('/help');
    
    // Test create community navigation
    fireEvent.click(screen.getByTestId('create-community-btn'));
    expect(mockPush).toHaveBeenCalledWith('/communities/create');
  });
});
