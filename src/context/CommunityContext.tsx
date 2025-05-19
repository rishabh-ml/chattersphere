"use client";

  import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

  // Define the Community type
  export interface Community {
    id: string;
    name: string;
    slug: string;
    description: string;
    image?: string;
    creator?: {
      _id: string;
      username: string;
      name: string;
      image?: string;
    };
    memberCount: number;
    postCount: number;
    isMember?: boolean;
    isModerator?: boolean;
    isCreator?: boolean;
    createdAt: string;
    updatedAt: string;
  }

  // Define the context type
  interface CommunityContextType {
    communities: Community[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    page: number;
    sortBy: 'members' | 'posts' | 'recent';
    fetchCommunities: (reset?: boolean) => Promise<void>;
    fetchMoreCommunities: () => Promise<void>;
    setSortBy: (sort: 'members' | 'posts' | 'recent') => void;
    createCommunity: (name: string, description: string, image?: string) => Promise<Community | null>;
    joinCommunity: (communityId: string) => Promise<void>;
    leaveCommunity: (communityId: string) => Promise<void>;
  }

  // Create the context
  const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

  // Create a provider component
  export const CommunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [sortBy, setSortByState] = useState<'members' | 'posts' | 'recent'>('members');

    // Fetch community function
    const fetchCommunities = useCallback(async (reset = false) => {
      try {
        setLoading(true);
        setError(null);

        const newPage = reset ? 1 : page;
        const response = await fetch(`/api/communities?page=${newPage}&limit=10&sort=${sortBy}`);

        if (!response.ok) {
          throw new Error('Failed to fetch community');
        }

        const data = await response.json();

        if (reset) {
          setCommunities(data.communities);
        } else {
          setCommunities(prev => [...prev, ...data.communities]);
        }

        setHasMore(data.pagination.hasMore);
        setPage(reset ? 2 : page + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }, [page, sortBy, setLoading, setError, setCommunities, setHasMore, setPage]);

    // Set sort by function
    const setSortBy = useCallback((sort: 'members' | 'posts' | 'recent') => {
      setSortByState(sort);
    }, [setSortByState]);

    // Fetch more community function
    const fetchMoreCommunities = useCallback(async () => {
      if (!loading && hasMore) {
        await fetchCommunities();
      }
    }, [fetchCommunities, loading, hasMore]);

    // Create community function
    const createCommunity = useCallback(async (name: string, description: string, image?: string): Promise<Community | null> => {
      try {
        setLoading(true);

        const response = await fetch('/api/communities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, description, image }),
        });

        if (!response.ok) {
          throw new Error('Failed to create community');
        }

        const data = await response.json();

        // Add the new community to the beginning of the community array
        setCommunities(prev => [data.community, ...prev]);

        return data.community;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    }, [setLoading, setCommunities, setError]);

    // Join community function
    const joinCommunity = useCallback(async (communityId: string) => {
      try {
        const response = await fetch(`/api/communities/${communityId}/membership`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'join' }),
        });

        if (!response.ok) {
          throw new Error('Failed to join community');
        }

        const data = await response.json();

        // Update the community in the community array
        setCommunities(prev => prev.map(community => {
          if (community.id === communityId) {
            return {
              ...community,
              memberCount: data.memberCount,
              isMember: true,
            };
          }
          return community;
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }, [setCommunities, setError]);

    // Leave community function
    const leaveCommunity = useCallback(async (communityId: string) => {
      try {
        const response = await fetch(`/api/communities/${communityId}/membership`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'leave' }),
        });

        if (!response.ok) {
          throw new Error('Failed to leave community');
        }

        const data = await response.json();

        // Update the community in the community array
        setCommunities(prev => prev.map(community => {
          if (community.id === communityId) {
            return {
              ...community,
              memberCount: data.memberCount,
              isMember: false,
              isModerator: false,
            };
          }
          return community;
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }, [setCommunities, setError]);

    // Effect to fetch community when sortBy changes
    React.useEffect(() => {
      fetchCommunities(true);
    }, [sortBy, fetchCommunities]);

    const value = {
      communities,
      loading,
      error,
      hasMore,
      page,
      sortBy,
      fetchCommunities,
      fetchMoreCommunities,
      setSortBy,
      createCommunity,
      joinCommunity,
      leaveCommunity,
    };

    return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
  };

  // Create a hook to use the context
  export const useCommunities = () => {
    const context = useContext(CommunityContext);
    if (context === undefined) {
      throw new Error('useCommunities must be used within a CommunityProvider');
    }
    return context;
  };