"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import PostEditor from "@/components/post-editor";
import { useSingleCommunity } from "@/context/SingleCommunityContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CommunityPostFormProps {
  onSuccess?: () => void;
}

export default function CommunityPostForm({ onSuccess }: CommunityPostFormProps) {
  const { community } = useSingleCommunity();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!community) {
      toast.error("Community not found");
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      toast.error("Post content cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: trimmed,
          communityId: community.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }
      
      const data = await response.json();
      
      toast.success("Post created successfully!");
      setContent("");
      onSuccess?.();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!community) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">Create a Post in {community.name}</h2>
      
      <form onSubmit={handleSubmit}>
        <PostEditor
          value={content}
          onChangeAction={setContent}
          placeholder={`What's on your mind?`}
          minHeight="120px"
          enableMediaUpload={true}
        />
        
        <div className="flex justify-end mt-4">
          <Button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              "Post"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
