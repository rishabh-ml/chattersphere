"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: 'TEXT' | 'VOICE' | 'ANNOUNCEMENT';
  isPrivate: boolean;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
  permissions: Record<string, boolean>;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  banner?: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  creator: {
    id: string;
    username: string;
    name: string;
    image?: string;
  };
  memberCount: number;
  postCount: number;
  channelCount: number;
  isMember: boolean;
  isModerator: boolean;
  isCreator: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  user: {
    id: string;
    username: string;
    name: string;
    image?: string;
  };
  roles: Role[];
  displayName?: string;
  joinedAt: string;
  lastActive: string;
}

interface SingleCommunityContextType {
  community: Community | null;
  channels: Channel[];
  members: Member[];
  roles: Role[];
  selectedChannel: Channel | null;
  loading: boolean;
  error: string | null;
  fetchCommunity: (slug: string) => Promise<void>;
  fetchChannels: (communityId: string) => Promise<void>;
  fetchMembers: (communityId: string) => Promise<void>;
  fetchRoles: (communityId: string) => Promise<void>;
  selectChannel: (channelId: string) => void;
  joinCommunity: (communityId: string) => Promise<boolean>;
  leaveCommunity: (communityId: string) => Promise<boolean>;
  createChannel: (data: Partial<Channel>) => Promise<Channel | null>;
  updateChannel: (channelId: string, data: Partial<Channel>) => Promise<Channel | null>;
  deleteChannel: (channelId: string) => Promise<boolean>;
}

const SingleCommunityContext = createContext<SingleCommunityContextType | undefined>(undefined);

export const useSingleCommunity = () => {
  const context = useContext(SingleCommunityContext);
  if (context === undefined) {
    throw new Error('useSingleCommunity must be used within a SingleCommunityProvider');
  }
  return context;
};

interface SingleCommunityProviderProps {
  children: ReactNode;
  initialCommunitySlug?: string;
}

export const SingleCommunityProvider: React.FC<SingleCommunityProviderProps> = ({
  children,
  initialCommunitySlug,
}) => {
  const { isSignedIn } = useUser();
  const [community, setCommunity] = useState<Community | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch community data with optimized loading
  const fetchCommunity = useCallback(async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      // Use AbortController to cancel requests if needed
      const controller = new AbortController();
      const signal = controller.signal;

      // Set a timeout to abort the request if it takes too long
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        // Fetch community data
        const res = await fetch(`/api/communities/slug/${slug}`, { signal });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch community');
        }

        const data = await res.json();
        setCommunity(data.community);

        // If we have community data, fetch channels in parallel
        if (data.community) {
          const communityId = data.community.id;

          // Fetch channels, members, and roles in parallel
          const [channelsRes, membersRes] = await Promise.all([
            fetch(`/api/communities/${communityId}/channels`, { signal }),
            fetch(`/api/communities/${communityId}/members?limit=20`, { signal }),
          ]);

          // Process channels response
          if (channelsRes.ok) {
            const channelsData = await channelsRes.json();
            setChannels(channelsData.channels);

            // Select the first channel by default if none is selected
            if (channelsData.channels.length > 0) {
              setSelectedChannel(current => current || channelsData.channels[0]);
            }
          } else {
            console.error('Error fetching channels:', await channelsRes.json());
          }

          // Process members response
          if (membersRes.ok) {
            const membersData = await membersRes.json();
            setMembers(membersData.members);
          } else {
            console.error('Error fetching members:', await membersRes.json());
          }
        }
      } finally {
        clearTimeout(timeout);
      }    } catch (err) {
      console.error('Error fetching community:', err);
      if ((err as Error).name === 'AbortError') {
        setError('Request timed out. Please try again.');
        toast.error('Request timed out. Please try again.');
      } else {
        setError((err as Error).message);
        toast.error((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch channels for a community
  const fetchChannels = useCallback(async (communityId: string) => {
    try {
      const res = await fetch(`/api/communities/${communityId}/channels`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch channels');
      }

      const data = await res.json();
      setChannels(data.channels);

      // Select the first channel by default if none is selected
      if (data.channels.length > 0) {
        // Use a functional update to avoid dependency on selectedChannel
        setSelectedChannel(current => current || data.channels[0]);
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
      toast.error('Failed to load channels');
    }
  }, []); // No dependencies needed with functional updates

  // Fetch members for a community
  const fetchMembers = useCallback(async (communityId: string) => {
    try {
      const res = await fetch(`/api/communities/${communityId}/members`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch members');
      }

      const data = await res.json();
      setMembers(data.members);
    } catch (err) {
      console.error('Error fetching members:', err);
      toast.error('Failed to load members');
    }
  }, []);

  // Fetch roles for a community
  const fetchRoles = useCallback(async (communityId: string) => {
    try {
      const res = await fetch(`/api/communities/${communityId}/roles`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch roles');
      }

      const data = await res.json();
      setRoles(data.roles);
    } catch (err) {
      console.error('Error fetching roles:', err);
      toast.error('Failed to load roles');
    }
  }, []);

  // Select a channel
  const selectChannel = useCallback((channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel) {
      setSelectedChannel(channel);
    }
  }, [channels]);

  // Join a community
  const joinCommunity = useCallback(async (communityId: string): Promise<boolean> => {
    if (!isSignedIn) {
      toast.error('You must be signed in to join a community');
      return false;
    }

    try {
      const res = await fetch(`/api/communities/${communityId}/membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'join' }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to join community');
      }

      const data = await res.json();

      // Update the community data
      if (community) {
        setCommunity({
          ...community,
          isMember: true,
          memberCount: data.memberCount,
        });
      }

      toast.success('Successfully joined the community');
      return true;
    } catch (err) {
      console.error('Error joining community:', err);
      toast.error((err as Error).message);
      return false;
    }
  }, [community, isSignedIn]);

  // Leave a community
  const leaveCommunity = useCallback(async (communityId: string): Promise<boolean> => {
    if (!isSignedIn) {
      toast.error('You must be signed in to leave a community');
      return false;
    }

    try {
      const res = await fetch(`/api/communities/${communityId}/membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'leave' }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to leave community');
      }

      const data = await res.json();

      // Update the community data
      if (community) {
        setCommunity({
          ...community,
          isMember: false,
          isModerator: false,
          memberCount: data.memberCount,
        });
      }

      toast.success('Successfully left the community');
      return true;
    } catch (err) {
      console.error('Error leaving community:', err);
      toast.error((err as Error).message);
      return false;
    }
  }, [community, isSignedIn]);

  // Create a new channel
  const createChannel = useCallback(async (data: Partial<Channel>): Promise<Channel | null> => {
    if (!community) {
      toast.error('No community selected');
      return null;
    }

    try {
      const res = await fetch(`/api/communities/${community.id}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create channel');
      }

      const responseData = await res.json();
      const newChannel = responseData.channel;

      // Update the channels list
      setChannels(prev => [...prev, newChannel]);

      // Update the community data
      setCommunity(prev => prev ? {
        ...prev,
        channelCount: prev.channelCount + 1,
      } : null);

      toast.success('Channel created successfully');
      return newChannel;
    } catch (err) {
      console.error('Error creating channel:', err);
      toast.error((err as Error).message);
      return null;
    }
  }, [community]);

  // Update a channel
  const updateChannel = useCallback(async (channelId: string, data: Partial<Channel>): Promise<Channel | null> => {
    if (!community) {
      toast.error('No community selected');
      return null;
    }

    try {
      const res = await fetch(`/api/communities/${community.id}/channels/${channelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update channel');
      }

      const responseData = await res.json();
      const updatedChannel = responseData.channel;

      // Update the channels list
      setChannels(prev => prev.map(channel =>
        channel.id === channelId ? updatedChannel : channel
      ));

      // Update the selected channel if it's the one being updated
      if (selectedChannel?.id === channelId) {
        setSelectedChannel(updatedChannel);
      }

      toast.success('Channel updated successfully');
      return updatedChannel;
    } catch (err) {
      console.error('Error updating channel:', err);
      toast.error((err as Error).message);
      return null;
    }
  }, [community, selectedChannel]);

  // Delete a channel
  const deleteChannel = useCallback(async (channelId: string): Promise<boolean> => {
    if (!community) {
      toast.error('No community selected');
      return false;
    }

    try {
      const res = await fetch(`/api/communities/${community.id}/channels/${channelId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete channel');
      }

      // Update the channels list
      setChannels(prev => prev.filter(channel => channel.id !== channelId));

      // Update the community data
      setCommunity(prev => prev ? {
        ...prev,
        channelCount: prev.channelCount - 1,
      } : null);

      // If the deleted channel was selected, select another one
      if (selectedChannel?.id === channelId) {
        const remainingChannels = channels.filter(channel => channel.id !== channelId);
        setSelectedChannel(remainingChannels.length > 0 ? remainingChannels[0] : null);
      }

      toast.success('Channel deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting channel:', err);
      toast.error((err as Error).message);
      return false;
    }
  }, [community, selectedChannel, channels]);

  // Fetch initial community data if a slug is provided
  useEffect(() => {
    if (initialCommunitySlug) {
      fetchCommunity(initialCommunitySlug);
    }
  }, [initialCommunitySlug, fetchCommunity]);

  const value = {
    community,
    channels,
    members,
    roles,
    selectedChannel,
    loading,
    error,
    fetchCommunity,
    fetchChannels,
    fetchMembers,
    fetchRoles,
    selectChannel,
    joinCommunity,
    leaveCommunity,
    createChannel,
    updateChannel,
    deleteChannel,
  };

  return (
    <SingleCommunityContext.Provider value={value}>
      {children}
    </SingleCommunityContext.Provider>
  );
};
