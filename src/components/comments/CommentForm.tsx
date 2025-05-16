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
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          ...(parentCommentId && { parentCommentId }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add comment");
      }

      const data = await response.json();
      onCommentAdded(data.comment);
      setContent("");
      toast.success(isReply ? "Reply added successfully" : "Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add comment");
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
