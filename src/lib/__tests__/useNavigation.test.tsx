import { renderHook } from '@testing-library/react';
import { useNavigation } from '../navigation';
import { useRouter } from 'next/navigation';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('useNavigation', () => {
  const mockPush = jest.fn();
  const mockEvent = {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  } as unknown as React.MouseEvent;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should navigate to profile', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToProfile('user-123');
    expect(mockPush).toHaveBeenCalledWith('/profile/user-123');
  });

  it('should navigate to profile and prevent default when event is provided', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToProfile('user-123', mockEvent);
    expect(mockPush).toHaveBeenCalledWith('/profile/user-123');
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should navigate to community with slug', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToCommunity('test-community');
    expect(mockPush).toHaveBeenCalledWith('/communities/test-community');
  });

  it('should navigate to community with ID when slug is not provided', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToCommunity(undefined, 'community-123');
    expect(mockPush).toHaveBeenCalledWith('/communities/community-123');
  });

  it('should navigate to post', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToPost('post-123');
    expect(mockPush).toHaveBeenCalledWith('/posts/post-123');
  });

  it('should navigate to followers', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToFollowers('user-123');
    expect(mockPush).toHaveBeenCalledWith('/profile/user-123/followers');
  });

  it('should navigate to following', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToFollowing('user-123');
    expect(mockPush).toHaveBeenCalledWith('/profile/user-123/following');
  });

  it('should navigate to channel', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToChannel('community-slug', 'channel-slug');
    expect(mockPush).toHaveBeenCalledWith('/communities/community-slug/channel-slug');
  });

  it('should navigate to home', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToHome();
    expect(mockPush).toHaveBeenCalledWith('/home');
  });

  it('should navigate to popular', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToPopular();
    expect(mockPush).toHaveBeenCalledWith('/popular');
  });

  it('should navigate to explore', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToExplore();
    expect(mockPush).toHaveBeenCalledWith('/explore');
  });

  it('should navigate to notifications', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToNotifications();
    expect(mockPush).toHaveBeenCalledWith('/notifications');
  });

  it('should navigate to saved', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToSaved();
    expect(mockPush).toHaveBeenCalledWith('/saved');
  });

  it('should navigate to messages', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToMessages();
    expect(mockPush).toHaveBeenCalledWith('/messages');
  });

  it('should navigate to settings', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToSettings();
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('should navigate to help', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToHelp();
    expect(mockPush).toHaveBeenCalledWith('/help');
  });

  it('should navigate to create community', () => {
    const { result } = renderHook(() => useNavigation());
    result.current.goToCreateCommunity();
    expect(mockPush).toHaveBeenCalledWith('/communities/create');
  });
});
