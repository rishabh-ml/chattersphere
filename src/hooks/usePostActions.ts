import { useState } from 'react';
import { toast } from 'sonner';

export function usePostActions() {
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isDownvoting, setIsDownvoting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const upvotePost = async (postId: string) => {
    setIsUpvoting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upvote post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error upvoting post:', error);
      throw error;
    } finally {
      setIsUpvoting(false);
    }
  };

  const downvotePost = async (postId: string) => {
    setIsDownvoting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/downvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to downvote post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error downvoting post:', error);
      throw error;
    } finally {
      setIsDownvoting(false);
    }
  };

  const savePost = async (postId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const deletePost = async (postId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    upvotePost,
    downvotePost,
    savePost,
    deletePost,
    isUpvoting,
    isDownvoting,
    isSaving,
    isDeleting,
  };
}
