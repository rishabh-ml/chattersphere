"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCommunities, Community } from "@/context/CommunityContext";
import { motion } from "framer-motion";
import { Loader2, Users, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommunitySkeleton from "@/components/skeletons/community-skeleton";
import CommunityCard from "@/components/community-card";
import { toast } from "sonner";

interface CommunityListProps {
  emptyMessage?: string;
  onCommunitySelect?: (community: Community) => void;
}

export default function CommunityList({
  emptyMessage = "No communities found",
  onCommunitySelect
}: CommunityListProps) {
  const {
    communities,
    loading,
    error,
    hasMore,
    fetchMoreCommunities,
    sortBy,
    setSortBy,
    joinCommunity,
    leaveCommunity
  } = useCommunities();

  const observer = useRef<IntersectionObserver | null>(null);

  // Set up the intersection observer for infinite scrolling
  const lastCommunityRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMoreCommunities();
      }
    });

    if (node) {
      observer.current.observe(node);
    }
  }, [loading, hasMore, fetchMoreCommunities, sortBy, page]);

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  const handleJoinLeave = async (communityId: string, isMember: boolean) => {
    try {
      if (isMember) {
        await leaveCommunity(communityId);
      } else {
        await joinCommunity(communityId);
      }
      // Toast notifications are handled in the CommunityCard component
    } catch (error) {
      console.error('Error updating community membership:', error);
      toast.error('Failed to update community membership');
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        <p>Error loading communities: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sortBy === 'members' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('members')}
            className={sortBy === 'members' ? 'bg-[#00AEEF] hover:bg-[#00AEEF]/90' : ''}
          >
            <Users className="h-4 w-4 mr-2" />
            Most Members
          </Button>
          <Button
            variant={sortBy === 'posts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('posts')}
            className={sortBy === 'posts' ? 'bg-[#00AEEF] hover:bg-[#00AEEF]/90' : ''}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Most Active
          </Button>
          <Button
            variant={sortBy === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('recent')}
            className={sortBy === 'recent' ? 'bg-[#00AEEF] hover:bg-[#00AEEF]/90' : ''}
          >
            <Clock className="h-4 w-4 mr-2" />
            Newest
          </Button>
        </div>
      </div>

      {communities.length === 0 && !loading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {communities.map((community, index) => {
            const communityCard = (
              <div key={community.id}>
                <CommunityCard
                  community={community}
                  onJoinLeave={handleJoinLeave}
                  onSelect={onCommunitySelect}
                />
              </div>
            );

            if (index === communities.length - 1) {
              return (
                <div key={community.id} ref={lastCommunityRef}>
                  {communityCard}
                </div>
              );
            }

            return communityCard;
          })}
        </div>
      )}

      {loading && (
        <div>
          {communities.length === 0 ? (
            // Show skeletons when initially loading
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CommunitySkeleton />
              <CommunitySkeleton />
              <CommunitySkeleton />
              <CommunitySkeleton />
            </div>
          ) : (
            // Show spinner when loading more communities
            <motion.div
              className="flex justify-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Loader2 className="h-8 w-8 text-[#00AEEF] animate-spin" />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
