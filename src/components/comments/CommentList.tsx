"use client";

import { useState, useEffect, useCallback } from "react";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

interface Comment {
  id: string;
  author: {
    id: string;
    username: string;
    name: string;
    image?: string;
  };
  content: string;
  upvoteCount: number;
  downvoteCount: number;
  voteCount: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  parentComment?: string;
  createdAt: string;
  updatedAt: string;
}

interface CommentListProps {
  postId: string;
}

export default function CommentList({ postId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [repliesMap, setRepliesMap] = useState<Record<string, Comment[]>>({});
  const { isSignedIn } = useUser();

  // Fetch top-level comments
  const fetchComments = useCallback(
    async (pageNum: number = 1) => {
      try {
        const response = await fetch(`/api/posts/${postId}/comments?page=${pageNum}&limit=10`);

        if (!response.ok) {
          throw new Error("Failed to fetch comments");
        }

        const data = await response.json();

        if (pageNum === 1) {
          setComments(data.comments);
        } else {
          setComments((prev) => [...prev, ...data.comments]);
        }

        setHasMore(data.pagination.hasMore);
        setPage(pageNum);
        setError(null);
      } catch (error) {
        console.error("Error fetching comments:", error);
        setError("Failed to load comments. Please try again later.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [postId]
  );

  // Fetch replies for a specific comment
  const fetchReplies = useCallback(
    async (commentId: string) => {
      try {
        const response = await fetch(`/api/posts/${postId}/comments?parentCommentId=${commentId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch replies");
        }

        const data = await response.json();

        setRepliesMap((prev) => ({
          ...prev,
          [commentId]: data.comments,
        }));
      } catch (error) {
        console.error("Error fetching replies:", error);
        toast.error("Failed to load replies");
      }
    },
    [postId]
  );

  // Initial load
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Load more comments
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    fetchComments(page + 1);
  };

  // Handle new comment added
  const handleCommentAdded = (newComment: Comment) => {
    if (newComment.parentComment) {
      // If it's a reply, add it to the replies map
      setRepliesMap((prev) => {
        const parentId = newComment.parentComment as string;
        const currentReplies = prev[parentId] || [];
        return {
          ...prev,
          [parentId]: [newComment, ...currentReplies],
        };
      });
    } else {
      // If it's a top-level comment, add it to the main comments list
      setComments((prev) => [newComment, ...prev]);
    }
  };

  // Handle comment deleted
  const handleCommentDeleted = (commentId: string) => {
    // Remove from main comments list
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));

    // Remove from replies map
    setRepliesMap((prev) => {
      const newMap = { ...prev };

      // Remove the comment from all reply lists
      Object.keys(newMap).forEach((parentId) => {
        newMap[parentId] = newMap[parentId].filter((reply) => reply.id !== commentId);
      });

      // Remove the comment's replies if it was a parent
      delete newMap[commentId];

      return newMap;
    });
  };

  // Toggle replies visibility
  const handleToggleReplies = (commentId: string) => {
    if (repliesMap[commentId]) {
      // If replies are already loaded, just remove them to hide
      const newMap = { ...repliesMap };
      delete newMap[commentId];
      setRepliesMap(newMap);
    } else {
      // Otherwise, fetch the replies
      fetchReplies(commentId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 my-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">Comments</h3>
        <span className="text-sm text-gray-500">({comments.length})</span>
      </div>

      {isSignedIn ? (
        <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center my-4">
          <p className="text-gray-600">Please sign in to comment</p>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center my-6">
          <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                postId={postId}
                onReplyAdded={handleCommentAdded}
                onCommentDeleted={handleCommentDeleted}
              />

              {/* Show/hide replies button if comment has replies */}
              {comment.commentCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-12 mb-2 text-xs text-indigo-600 hover:text-indigo-800"
                  onClick={() => handleToggleReplies(comment.id)}
                >
                  {repliesMap[comment.id]
                    ? "Hide replies"
                    : `Show ${comment.commentCount} ${comment.commentCount === 1 ? "reply" : "replies"}`}
                </Button>
              )}

              {/* Render replies if loaded */}
              {repliesMap[comment.id] && (
                <div className="ml-12 border-l-2 border-gray-100 pl-4">
                  {repliesMap[comment.id].map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      postId={postId}
                      onReplyAdded={handleCommentAdded}
                      onCommentDeleted={handleCommentDeleted}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full max-w-xs"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more comments...
              </>
            ) : (
              "Load more comments"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
