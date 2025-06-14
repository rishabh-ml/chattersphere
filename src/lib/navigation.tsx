/**
 * Navigation utility functions for consistent URL handling across the application
 */

import React, { createContext, useContext, ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * URL builder functions for consistent URL generation
 */
export const routes = {
  /**
   * Generate a URL for a user profile
   * @param userId - The MongoDB ID of the user
   */
  profile: (userId: string) => `/profile/${userId}`,

  /**
   * Generate a URL for a community
   * @param communitySlug - The slug of the community
   * @param communityId - The ID of the community (fallback if slug is not available)
   */
  community: (communitySlug?: string, communityId?: string) =>
    `/communities/${communitySlug || communityId}`,

  /**
   * Generate a URL for a post
   * @param postId - The ID of the post
   */
  post: (postId: string) => `/posts/${postId}`,

  /**
   * Generate a URL for a user's followers
   * @param userId - The MongoDB ID of the user
   */
  followers: (userId: string) => `/profile/${userId}/followers`,

  /**
   * Generate a URL for a user's following list
   * @param userId - The MongoDB ID of the user
   */
  following: (userId: string) => `/profile/${userId}/following`,

  /**
   * Generate a URL for a community channel
   * @param communitySlug - The slug of the community
   * @param channelSlug - The slug of the channel
   */
  channel: (communitySlug: string, channelSlug: string) =>
    `/communities/${communitySlug}/${channelSlug}`,

  /**
   * Generate a URL for the home feed
   */
  home: () => "/home",

  /**
   * Generate a URL for the popular feed
   */
  popular: () => "/popular",

  /**
   * Generate a URL for the explore page
   */
  explore: () => "/explore",

  /**
   * Generate a URL for the notifications page
   */
  notifications: () => "/notifications",

  /**
   * Generate a URL for the saved posts page
   */
  saved: () => "/saved",

  /**
   * Generate a URL for the messages page
   */
  messages: () => "/messages",

  /**
   * Generate a URL for the settings page
   */
  settings: () => "/settings",

  /**
   * Generate a URL for the help page
   */
  help: () => "/help",

  /**
   * Generate a URL for creating a new community
   */
  createCommunity: () => "/communities/create",
};

/**
 * Hook for handling navigation with proper event handling
 * @returns Navigation utility functions
 */
export const useNavigation = () => {
  const router = useRouter();

  const navigation = {
    /**
     * Navigate to a user's profile
     * @param userId - The MongoDB ID of the user
     * @param e - Optional click event to prevent default behavior
     */
    goToProfile: (userId: string, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.profile(userId));
    },

    /**
     * Navigate to a community page
     * @param communitySlug - The slug of the community
     * @param communityId - The ID of the community (fallback if slug is not available)
     * @param e - Optional click event to prevent default behavior
     */
    goToCommunity: (communitySlug?: string, communityId?: string, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.community(communitySlug, communityId));
    },

    /**
     * Navigate to a post detail page
     * @param postId - The ID of the post
     * @param e - Optional click event to prevent default behavior
     */
    goToPost: (postId: string, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.post(postId));
    },

    /**
     * Navigate to a user's followers page
     * @param userId - The MongoDB ID of the user
     * @param e - Optional click event to prevent default behavior
     */
    goToFollowers: (userId: string, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.followers(userId));
    },

    /**
     * Navigate to a user's following page
     * @param userId - The MongoDB ID of the user
     * @param e - Optional click event to prevent default behavior
     */
    goToFollowing: (userId: string, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.following(userId));
    },

    /**
     * Navigate to a community channel
     * @param communitySlug - The slug of the community
     * @param channelSlug - The slug of the channel
     * @param e - Optional click event to prevent default behavior
     */
    goToChannel: (communitySlug: string, channelSlug: string, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.channel(communitySlug, channelSlug));
    },

    /**
     * Navigate to the home feed
     * @param e - Optional click event to prevent default behavior
     */
    goToHome: (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.home());
    },

    /**
     * Navigate to the popular feed
     * @param e - Optional click event to prevent default behavior
     */
    goToPopular: (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.popular());
    },

    /**
     * Navigate to the explore page
     * @param e - Optional click event to prevent default behavior
     */
    goToExplore: (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.explore());
    },

    /**
     * Navigate to the notifications page
     * @param e - Optional click event to prevent default behavior
     */
    goToNotifications: (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.notifications());
    },

    /**
     * Navigate to the saved posts page
     * @param e - Optional click event to prevent default behavior
     */
    goToSaved: (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.saved());
    },

    /**
     * Navigate to the messages page
     * @param e - Optional click event to prevent default behavior
     */
    goToMessages: (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.messages());
    },

    /**
     * Navigate to the settings page
     * @param e - Optional click event to prevent default behavior
     */
    goToSettings: (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.settings());
    },

    /**
     * Navigate to the help page
     * @param e - Optional click event to prevent default behavior
     */
    goToHelp: (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.help());
    },

    /**
     * Navigate to the create community page
     * @param e - Optional click event to prevent default behavior
     */
    goToCreateCommunity: (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      router.push(routes.createCommunity());
    },
  };

  return navigation;
};

// Create a context for the navigation utilities
type NavigationContextType = ReturnType<typeof useNavigation>;

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

/**
 * Provider component for the navigation utilities
 */
export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigation = useNavigation();

  return <NavigationContext.Provider value={navigation}>{children}</NavigationContext.Provider>;
};

/**
 * Hook to use the navigation context
 * This is an alternative to useNavigation that doesn't require creating a new instance
 * of the navigation utilities in every component
 */
export const useNavigationContext = () => {
  const context = useContext(NavigationContext);

  if (context === undefined) {
    throw new Error("useNavigationContext must be used within a NavigationProvider");
  }

  return context;
};
