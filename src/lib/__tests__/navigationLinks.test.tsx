import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Link from 'next/link';
import { useNavigation, routes } from '../navigation';
import { useRouter } from 'next/navigation';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn().mockReturnValue('/'),
}));

// Test component that uses the navigation hook with Link components
function TestLinkComponent() {
  const navigation = useNavigation();
  
  return (
    <div>
      <Link 
        href={routes.profile('user-123')} 
        data-testid="profile-link"
        onClick={(e) => navigation.goToProfile('user-123', e)}
      >
        Profile Link
      </Link>
      
      <Link 
        href={routes.community('test-community')} 
        data-testid="community-link"
        onClick={(e) => navigation.goToCommunity('test-community', undefined, e)}
      >
        Community Link
      </Link>
      
      <Link 
        href={routes.post('post-123')} 
        data-testid="post-link"
        onClick={(e) => navigation.goToPost('post-123', e)}
      >
        Post Link
      </Link>
      
      <Link 
        href={routes.home()} 
        data-testid="home-link"
        onClick={(e) => navigation.goToHome(e)}
      >
        Home Link
      </Link>
    </div>
  );
}

describe('Navigation Links', () => {
  const mockPush = jest.fn();
  const mockPreventDefault = jest.fn();
  const mockStopPropagation = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });
  
  it('should navigate correctly when links are clicked', () => {
    render(<TestLinkComponent />);
    
    // Test profile link
    fireEvent.click(screen.getByTestId('profile-link'), {
      preventDefault: mockPreventDefault,
      stopPropagation: mockStopPropagation,
    });
    expect(mockPush).toHaveBeenCalledWith('/profile/user-123');
    expect(mockPreventDefault).toHaveBeenCalled();
    expect(mockStopPropagation).toHaveBeenCalled();
    
    // Reset mocks
    mockPreventDefault.mockClear();
    mockStopPropagation.mockClear();
    
    // Test community link
    fireEvent.click(screen.getByTestId('community-link'), {
      preventDefault: mockPreventDefault,
      stopPropagation: mockStopPropagation,
    });
    expect(mockPush).toHaveBeenCalledWith('/communities/test-community');
    expect(mockPreventDefault).toHaveBeenCalled();
    expect(mockStopPropagation).toHaveBeenCalled();
    
    // Reset mocks
    mockPreventDefault.mockClear();
    mockStopPropagation.mockClear();
    
    // Test post link
    fireEvent.click(screen.getByTestId('post-link'), {
      preventDefault: mockPreventDefault,
      stopPropagation: mockStopPropagation,
    });
    expect(mockPush).toHaveBeenCalledWith('/posts/post-123');
    expect(mockPreventDefault).toHaveBeenCalled();
    expect(mockStopPropagation).toHaveBeenCalled();
    
    // Reset mocks
    mockPreventDefault.mockClear();
    mockStopPropagation.mockClear();
    
    // Test home link
    fireEvent.click(screen.getByTestId('home-link'), {
      preventDefault: mockPreventDefault,
      stopPropagation: mockStopPropagation,
    });
    expect(mockPush).toHaveBeenCalledWith('/home');
    expect(mockPreventDefault).toHaveBeenCalled();
    expect(mockStopPropagation).toHaveBeenCalled();
  });
  
  it('should have correct href attributes', () => {
    render(<TestLinkComponent />);
    
    expect(screen.getByTestId('profile-link')).toHaveAttribute('href', '/profile/user-123');
    expect(screen.getByTestId('community-link')).toHaveAttribute('href', '/communities/test-community');
    expect(screen.getByTestId('post-link')).toHaveAttribute('href', '/posts/post-123');
    expect(screen.getByTestId('home-link')).toHaveAttribute('href', '/home');
  });
});
