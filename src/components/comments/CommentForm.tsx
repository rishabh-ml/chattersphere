"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface CommentFormProps {
  postId: string;
  parentCommentId?: string;
  onCommentAdded: (comment: any) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  isReply?: boolean;
}

export default function CommentForm({
  postId,
  parentCommentId,
  onCommentAdded,
  onCancel,
  placeholder = "Write a comment...",
  autoFocus = false,
  isReply = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isSignedIn } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!content.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort(new DOMException('Timeout exceeded', 'TimeoutError'));
      }, 10000); // 10 second timeout

      try {
        // Add a timestamp to prevent caching issues
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/posts/${postId}/comments?_=${timestamp}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          },
          body: JSON.stringify({
            content: content.trim(),
            ...(parentCommentId && { parentCommentId }),
          }),
          signal: controller.signal
        });

        // Clear the timeout as soon as the response is received
        clearTimeout(timeoutId);

        // Handle non-OK responses
        if (!response.ok) {
          let errorMessage = "Failed to add comment";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
          }
          throw new Error(errorMessage);
        }

        // Parse the response data
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Error parsing success response:", parseError);
          throw new Error("Invalid response from server");
        }

        // Check if the comment data is valid
        if (!data || !data.comment) {
          throw new Error("Invalid comment data received");
        }

        // Call the callback with the new comment
        onCommentAdded(data.comment);
        setContent("");
        toast.success(isReply ? "Reply added successfully" : "Comment added successfully");
      } finally {
        // Ensure timeout is cleared
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      console.error("Error adding comment:", error);

      // Handle different types of errors
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        toast.error("Request timed out. Please try again later.");
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to add comment");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${isReply ? 'ml-12 mt-2' : 'mt-4'}`}>
      <div className="flex gap-3">
        {user?.imageUrl && (
          <Avatar className="h-8 w-8">
            <img
              src={user.imageUrl}
              alt={user.username || "User"}
              className="h-full w-full object-cover"
            />
          </Avatar>
        )}
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="min-h-[80px] resize-none border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
            disabled={isSubmitting || !isSignedIn}
          />
          <div className="mt-2 flex justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !content.trim() || !isSignedIn}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isReply ? "Replying..." : "Commenting..."}
                </>
              ) : (
                isReply ? "Reply" : "Comment"
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
