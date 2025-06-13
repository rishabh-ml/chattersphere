import { useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { AuthEvent, AuthEventCallback, AuthProvider, SessionInfo, UserProfile } from '../types';
import { AuthService } from '../services/authService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Custom hook for auth functionality
 * Combines Clerk's hooks with our custom AuthService
 */
export function useAuthManager() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [eventCallbacks] = useState<AuthEventCallback[]>([]);
  
  // Current user profile (with extended data)
  const { 
    data: userProfile,
    isLoading: isLoadingProfile,
    refetch: refetchProfile
  } = useQuery<UserProfile | null>({
    queryKey: ['userProfile'],
    queryFn: () => AuthService.getCurrentUser(),
    enabled: !!isSignedIn,
  });
  
  // Sessions
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    refetch: refetchSessions
  } = useQuery<SessionInfo[]>({
    queryKey: ['authSessions'],
    queryFn: () => AuthService.getSessions(),
    enabled: !!isSignedIn,
  });
  
  // Auth providers
  const {
    data: authProviders = [],
    isLoading: isLoadingProviders,
    refetch: refetchProviders
  } = useQuery<AuthProvider[]>({
    queryKey: ['authProviders'],
    queryFn: () => AuthService.getAuthProviders(),
    enabled: !!isSignedIn,
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (updateData: Partial<UserProfile>) => AuthService.updateProfile(updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      triggerEvent(AuthEvent.USER_UPDATED);
    }
  });
  
  // Terminate session mutation
  const terminateSessionMutation = useMutation({
    mutationFn: (sessionId: string) => AuthService.terminateSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authSessions'] });
      triggerEvent(AuthEvent.SESSION_ENDED);
    }
  });
  
  // Link provider mutation
  const linkProviderMutation = useMutation({
    mutationFn: ({ provider, options }: { provider: 'google' | 'apple' | 'github' | 'discord', options?: any }) => 
      AuthService.linkAuthProvider(provider, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authProviders'] });
    }
  });
  
  // Unlink provider mutation
  const unlinkProviderMutation = useMutation({
    mutationFn: (provider: 'google' | 'apple' | 'github' | 'discord') => AuthService.unlinkAuthProvider(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authProviders'] });
    }
  });
  
  // Two-factor mutations
  const enableTwoFactorMutation = useMutation({
    mutationFn: () => AuthService.enableTwoFactor(),
  });
  
  const disableTwoFactorMutation = useMutation({
    mutationFn: () => AuthService.disableTwoFactor(),
  });
  
  // Helper to trigger events
  function triggerEvent(event: AuthEvent, data?: any) {
    eventCallbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in auth event callback:', error);
      }
    });
  }
  
  // Helper to add event listeners
  function addEventListener(callback: AuthEventCallback) {
    if (!eventCallbacks.includes(callback)) {
      eventCallbacks.push(callback);
    }
    
    // Return function to remove the listener
    return () => {
      const index = eventCallbacks.indexOf(callback);
      if (index !== -1) {
        eventCallbacks.splice(index, 1);
      }
    };
  }
  
  // Handle sign out
  const handleSignOut = async () => {
    triggerEvent(AuthEvent.SIGNED_OUT);
    await signOut();
  };
  
  return {
    // Clerk user data
    user,
    isLoaded,
    isSignedIn,
    
    // Extended user data
    userProfile,
    sessions,
    authProviders,
    
    // Loading states
    isLoadingProfile,
    isLoadingSessions,
    isLoadingProviders,
    
    // Actions
    signOut: handleSignOut,
    updateProfile: updateProfileMutation.mutateAsync,
    terminateSession: terminateSessionMutation.mutateAsync,
    linkProvider: linkProviderMutation.mutateAsync,
    unlinkProvider: unlinkProviderMutation.mutateAsync,
    enableTwoFactor: enableTwoFactorMutation.mutateAsync,
    disableTwoFactor: disableTwoFactorMutation.mutateAsync,
    
    // Event handling
    addEventListener,
    
    // Refetching
    refetchProfile,
    refetchSessions,
    refetchProviders,
  };
}
