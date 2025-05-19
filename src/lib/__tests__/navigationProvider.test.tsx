import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationProvider, useNavigationContext, routes } from '../navigation';
import { useRouter } from 'next/navigation';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn().mockReturnValue('/'),
}));

// Test component that uses the navigation context
function TestComponent() {
  const navigation = useNavigationContext();
  
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
    </div>
  );
}

describe('NavigationProvider', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });
  
  it('should provide navigation context to children', () => {
    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );
    
    // Test profile navigation
    fireEvent.click(screen.getByTestId('profile-btn'));
    expect(mockPush).toHaveBeenCalledWith('/profile/user-123');
    
    // Test community navigation
    fireEvent.click(screen.getByTestId('community-btn'));
    expect(mockPush).toHaveBeenCalledWith('/communities/test-community');
    
    // Test post navigation
    fireEvent.click(screen.getByTestId('post-btn'));
    expect(mockPush).toHaveBeenCalledWith('/posts/post-123');
  });
  
  it('should throw an error when used outside of NavigationProvider', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNavigationContext must be used within a NavigationProvider');
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});
