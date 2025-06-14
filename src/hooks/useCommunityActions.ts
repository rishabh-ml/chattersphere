import { useState } from "react";
import { toast } from "sonner";

export function useCommunityActions() {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const joinCommunity = async (communityId: string) => {
    setIsJoining(true);
    try {
      const response = await fetch(`/api/communities/${communityId}/membership`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join community");
      }

      return await response.json();
    } catch (error) {
      console.error("Error joining community:", error);
      throw error;
    } finally {
      setIsJoining(false);
    }
  };

  const leaveCommunity = async (communityId: string) => {
    setIsLeaving(true);
    try {
      const response = await fetch(`/api/communities/${communityId}/membership`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to leave community");
      }

      return await response.json();
    } catch (error) {
      console.error("Error leaving community:", error);
      throw error;
    } finally {
      setIsLeaving(false);
    }
  };

  return {
    joinCommunity,
    leaveCommunity,
    isJoining,
    isLeaving,
  };
}
