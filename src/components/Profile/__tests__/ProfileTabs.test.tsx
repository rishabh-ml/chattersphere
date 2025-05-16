import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ProfileTabs from '../ProfileTabs';

// Mock child components
vi.mock('../AboutTab', () => ({
  default: ({ user, isOwner }) => (
    <div data-testid="about-tab">
      About Tab (isOwner: {isOwner.toString()})
      <div>{user.name}</div>
    </div>
  ),
}));

vi.mock('../ActivityTab', () => ({
  default: ({ userId }) => (
    <div data-testid="activity-tab">
      Activity Tab (userId: {userId})
    </div>
  ),
}));

vi.mock('../PrivacyTab', () => ({
  default: ({ userId, privacySettings }) => (
    <div data-testid="privacy-tab">
      Privacy Tab (userId: {userId})
      <div>Show Email: {privacySettings?.showEmail?.toString() || 'false'}</div>
    </div>
  ),
}));

describe('ProfileTabs', () => {
  const mockUser = {
    id: '123',
    clerkId: 'clerk_123',
    username: 'testuser',
    name: 'Test User',
    bio: 'This is a test bio',
    privacySettings: {
      showEmail: false,
      showActivity: true,
      allowFollowers: true,
      allowMessages: true,
    },
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockProps = {
    user: mockUser,
    isOwner: false,
    onProfileUpdate: vi.fn(),
    onPrivacyUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the About tab by default', () => {
    render(<ProfileTabs {...mockProps} />);
    
    expect(screen.getByTestId('about-tab')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.queryByTestId('activity-tab')).not.toBeInTheDocument();
    expect(screen.queryByTestId('privacy-tab')).not.toBeInTheDocument();
  });

  it('switches to Activity tab when clicked', () => {
    render(<ProfileTabs {...mockProps} />);
    
    fireEvent.click(screen.getByRole('tab', { name: /activity/i }));
    
    expect(screen.getByTestId('activity-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('about-tab')).not.toBeInTheDocument();
  });

  it('shows Privacy tab only when isOwner is true', () => {
    const { rerender } = render(<ProfileTabs {...mockProps} />);
    
    // Privacy tab should not be visible when not owner
    expect(screen.queryByRole('tab', { name: /privacy/i })).not.toBeInTheDocument();
    
    // Rerender with isOwner=true
    rerender(<ProfileTabs {...mockProps} isOwner={true} />);
    
    // Privacy tab should now be visible
    expect(screen.getByRole('tab', { name: /privacy/i })).toBeInTheDocument();
    
    // Click on Privacy tab
    fireEvent.click(screen.getByRole('tab', { name: /privacy/i }));
    
    // Privacy tab content should be visible
    expect(screen.getByTestId('privacy-tab')).toBeInTheDocument();
    expect(screen.getByText('Show Email: false')).toBeInTheDocument();
  });

  it('passes the correct props to child components', () => {
    render(<ProfileTabs {...mockProps} isOwner={true} />);
    
    // Check About tab
    expect(screen.getByText('About Tab (isOwner: false)')).toBeInTheDocument();
    
    // Switch to Activity tab
    fireEvent.click(screen.getByRole('tab', { name: /activity/i }));
    expect(screen.getByText('Activity Tab (userId: 123)')).toBeInTheDocument();
    
    // Switch to Privacy tab
    fireEvent.click(screen.getByRole('tab', { name: /privacy/i }));
    expect(screen.getByText('Privacy Tab (userId: 123)')).toBeInTheDocument();
  });
});
