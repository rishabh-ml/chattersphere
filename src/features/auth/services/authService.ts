import {
  AccountVerification,
  AuthMetadata,
  AuthOptions,
  AuthProvider,
  SessionInfo,
  UserProfile
} from "../types";

/**
 * Service for handling authentication with Clerk
 * This is a wrapper around Clerk's functionality that provides
 * a more consistent API and adds custom functionality
 */
export class AuthService {
  /**
   * Get the current user profile
   * @returns User profile
   */
  static async getCurrentUser(): Promise<UserProfile | null> {
    // In a real app, this would likely use Clerk's client-side SDK
    // but we implement a server-side API call for consistency
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }
  
  /**
   * Get the user's account verification status
   * @returns Verification status
   */
  static async getVerificationStatus(): Promise<AccountVerification | null> {
    try {
      const response = await fetch('/api/auth/verification', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.verification;
    } catch (error) {
      console.error('Error fetching verification status:', error);
      return null;
    }
  }
  
  /**
   * Get the user's authentication metadata
   * @returns Authentication metadata
   */
  static async getAuthMetadata(): Promise<AuthMetadata | null> {
    try {
      const response = await fetch('/api/auth/metadata', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.metadata;
    } catch (error) {
      console.error('Error fetching auth metadata:', error);
      return null;
    }
  }
  
  /**
   * Get the user's active sessions
   * @returns List of sessions
   */
  static async getSessions(): Promise<SessionInfo[]> {
    try {
      const response = await fetch('/api/auth/sessions', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return data.sessions;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }
  
  /**
   * Terminate a specific session
   * @param sessionId ID of the session to terminate
   * @returns Success status
   */
  static async terminateSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error terminating session:', error);
      return false;
    }
  }
  
  /**
   * Update the user's profile information
   * @param updateData Profile data to update
   * @returns Updated user profile
   */
  static async updateProfile(updateData: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }
  
  /**
   * Get the user's linked authentication providers
   * @returns List of auth providers
   */
  static async getAuthProviders(): Promise<AuthProvider[]> {
    try {
      const response = await fetch('/api/auth/providers', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return data.providers;
    } catch (error) {
      console.error('Error fetching auth providers:', error);
      return [];
    }
  }
  
  /**
   * Link an authentication provider to the user's account
   * @param provider Provider to link
   * @param options Additional options
   * @returns Success status
   */
  static async linkAuthProvider(provider: 'google' | 'apple' | 'github' | 'discord', options?: AuthOptions): Promise<boolean> {
    // In a real app, this would use Clerk's client SDK
    // This is a placeholder implementation
    try {
      const url = `/api/auth/link-provider?provider=${provider}`;
      const redirectUrl = options?.redirectUrl ? `&redirectUrl=${encodeURIComponent(options.redirectUrl)}` : '';
      
      window.location.href = `${url}${redirectUrl}`;
      return true;
    } catch (error) {
      console.error('Error linking provider:', error);
      return false;
    }
  }
  
  /**
   * Unlink an authentication provider from the user's account
   * @param provider Provider to unlink
   * @returns Success status
   */
  static async unlinkAuthProvider(provider: 'google' | 'apple' | 'github' | 'discord'): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/providers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ provider })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error unlinking provider:', error);
      return false;
    }
  }
  
  /**
   * Enable two-factor authentication for the user
   * @returns Success status
   */
  static async enableTwoFactor(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/two-factor', {
        method: 'POST',
        credentials: 'include'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error enabling two-factor:', error);
      return false;
    }
  }
  
  /**
   * Disable two-factor authentication for the user
   * @returns Success status
   */
  static async disableTwoFactor(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/two-factor', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error disabling two-factor:', error);
      return false;
    }
  }
}
