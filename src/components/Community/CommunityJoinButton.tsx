"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCommunityActions } from "@/hooks/useCommunityActions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Community } from "@/types";

interface CommunityJoinButtonProps {
  community: Community;
}

export default function CommunityJoinButton({ community }: CommunityJoinButtonProps) {
  const { joinCommunity, leaveCommunity, isJoining, isLeaving } = useCommunityActions();

  // Don't show the button if the user is the creator
  if (community.isCreator) {
    return null;
  }

  const handleJoinCommunity = async () => {
    try {
      await joinCommunity(community.id);
      toast.success(`Successfully joined ${community.name}`);
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };

  const handleLeaveCommunity = async () => {
    try {
      await leaveCommunity(community.id);
      toast.success(`Successfully left ${community.name}`);
    } catch (error) {
      console.error("Error leaving community:", error);
      toast.error("Failed to leave community");
    }
  };

  if (community.isMember) {
    return (
      <Button
        variant="outline"
        className="border-red-300 text-red-600 hover:bg-red-50"
        onClick={handleLeaveCommunity}
        disabled={isLeaving}
      >
        {isLeaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Leaving...
          </>
        ) : (
          "Leave Community"
        )}
      </Button>
    );
  }

  return (
    <Button
      className="bg-indigo-600 hover:bg-indigo-700 text-white"
      onClick={handleJoinCommunity}
      disabled={isJoining}
    >
      {isJoining ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Joining...
        </>
      ) : (
        "Join Community"
      )}
    </Button>
  );
}
