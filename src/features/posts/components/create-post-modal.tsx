"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCommunities, Community } from "@/context/CommunityContext";
import { PostProvider } from "@/context/PostContext";
import CreatePostForm from "@/components/create-post-form";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const { isSignedIn } = useUser();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's communities
  useEffect(() => {
    if (isOpen && isSignedIn) {
      const fetchCommunities = async () => {
        try {
          setLoading(true);
          // First try to fetch from my-communities endpoint
          try {
            const response = await fetch("/api/communities/my-communities");
            if (response.ok) {
              const data = await response.json();
              setCommunities(data.communities || []);
              return;
            }
          } catch (error) {
            console.warn(
              "Error fetching from my-communities endpoint, falling back to main communities endpoint"
            );
          }

          // Fallback to the main communities endpoint
          const fallbackResponse = await fetch("/api/communities?limit=50");
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            setCommunities(data.communities || []);
          } else {
            // If both fail, set empty array
            setCommunities([]);
          }
        } catch (error) {
          console.error("Error fetching communities:", error);
          setCommunities([]);
        } finally {
          setLoading(false);
        }
      };

      fetchCommunities();
    }
  }, [isOpen, isSignedIn]);

  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">Create a Post</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 text-[#00AEEF] animate-spin" />
            </div>
          ) : (
            <PostProvider>
              <CreatePostForm
                communities={communities}
                onSuccess={handleSuccess}
                startExpanded={true}
              />
            </PostProvider>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
