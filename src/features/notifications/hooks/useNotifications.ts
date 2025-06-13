import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { NotificationsService } from '../services/notificationsService';
import { Notification, NotificationPreferences } from '../types';

/**
 * Hook for working with notifications
 */
export function useNotifications() {
  const queryClient = useQueryClient();
  
  // Get notifications
  const { 
    data: notificationsData,
    isLoading: isLoadingNotifications,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }: { pageParam?: string }) => NotificationsService.getNotifications(pageParam),
    getNextPageParam: (lastPage: any) => lastPage.nextCursor,
    initialPageParam: undefined,
  });
  
  // Get unread count
  const {
    data: unreadCount = 0,
    isLoading: isLoadingUnreadCount,
    refetch: refetchUnreadCount
  } = useQuery<number>({
    queryKey: ['notificationsCount'],
    queryFn: () => NotificationsService.getUnreadCount(),
  });
  
  // Get notification preferences
  const {
    data: preferences,
    isLoading: isLoadingPreferences
  } = useQuery<NotificationPreferences>({
    queryKey: ['notificationPreferences'],
    queryFn: () => NotificationsService.getPreferences(),
    // Disable by default until explicitly needed
    enabled: false,
  });
  
  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => NotificationsService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsCount'] });
    }
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => NotificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsCount'] });
    }
  });
  
  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => NotificationsService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
    // Update notification preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: (newPreferences: Partial<NotificationPreferences>) => 
      NotificationsService.updatePreferences(newPreferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
    }
  });

  return {
    // Data
    notifications: notificationsData?.pages?.flatMap(page => page.notifications) || [],
    hasMoreNotifications: hasNextPage,
    unreadCount,
    preferences,
    
    // Loading states
    isLoadingNotifications,
    isLoadingUnreadCount,
    isLoadingPreferences,
    isFetchingNextPage,
    
    // Actions
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    loadMoreNotifications: fetchNextPage,
    
    // Refetch functions
    refetchUnreadCount,
  };
}
