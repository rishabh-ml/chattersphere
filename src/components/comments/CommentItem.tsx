"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowUp, ArrowDown, Reply, Trash2, MoreVertical } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import CommentForm from "./CommentForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentItemProps {
  comment: {
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
  };
  postId: string;
  onReplyAdded: (comment: any) => void;
  onCommentDeleted: (commentId: string) => void;
}

export default function CommentItem({
  comment,
  postId,
  onReplyAdded,
  onCommentDeleted,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(comment.upvoteCount);
  const [downvoteCount, setDownvoteCount] = useState(comment.downvoteCount);
  const [voteCount, setVoteCount] = useState(comment.voteCount);
  const [isUpvoted, setIsUpvoted] = useState(comment.isUpvoted);
  const [isDownvoted, setIsDownvoted] = useState(comment.isDownvoted);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { user, isSignedIn } = useUser();
  const isAuthor = isSignedIn && user?.id === comment.author.id;

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!isSignedIn) {
      toast.error("Please sign in to vote");
      return;
    }

    try {
      const response = await fetch(`/api/comments/${comment.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();
      
      setUpvoteCount(data.voteStatus.upvoteCount);
      setDownvoteCount(data.voteStatus.downvoteCount);
      setVoteCount(data.voteStatus.voteCount);
      setIsUpvoted(data.voteStatus.isUpvoted);
      setIsDownvoted(data.voteStatus.isDownvoted);
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to vote on comment");
    }
  };

  const handleDelete = async () => {
    if (!isSignedIn || !isAuthor) {
      toast.error("You can only delete your own comments");
      return;
    }

    if (window.confirm("Are you sure you want to delete this comment?")) {
      setIsDeleting(true);
      
      try {
        const response = await fetch(`/api/comments/${comment.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete comment");
        }

        onCommentDeleted(comment.id);
        toast.success("Comment deleted successfully");
      } catch (error) {
        console.error("Error deleting comment:", error);
        toast.error("Failed to delete comment");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleReplyAdded = (newReply: any) => {
    onReplyAdded(newReply);
    setIsReplying(false);
  };

  return (
    <div className="py-4 group">
      <div className="flex gap-3">
        {/* Vote buttons (vertical) */}
        <div className="flex flex-col items-center space-y-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded-full",
              isUpvoted && "text-indigo-600 bg-indigo-50"
            )}
            onClick={() => handleVote("upvote")}
          >
            <ArrowUp className="h-4 w-4" />
            <span className="sr-only">Upvote</span>
          </Button>
          
          <span className={cn(
            "text-xs font-medium",
            voteCount > 0 && "text-indigo-600",
            voteCount < 0 && "text-red-600"
          )}>
            {voteCount}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded-full",
              isDownvoted && "text-red-600 bg-red-50"
            )}
            onClick={() => handleVote("downvote")}
          >
            <ArrowDown className="h-4 w-4" />
            <span className="sr-only">Downvote</span>
          </Button>
        </div>
        
        {/* Comment content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/profile/${comment.author.id}`}>
              <Avatar className="h-6 w-6">
                {comment.author.image ? (
                  <img
                    src={comment.author.image}
                    alt={comment.author.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-medium">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Avatar>
            </Link>
            
            <div className="flex items-center gap-2">
              <Link 
                href={`/profile/${comment.author.id}`}
                className="text-sm font-medium hover:underline"
              >
                {comment.author.name}
              </Link>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-800 whitespace-pre-wrap">
            {comment.content}
          </div>
          
          <div className="mt-2 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-gray-600 hover:text-indigo-600"
              onClick={() => setIsReplying(!isReplying)}
            >
              <Reply className="h-3.5 w-3.5 mr-1" />
              Reply
            </Button>
            
            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-gray-600 hover:text-red-600"
                    disabled={isDeleting}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {isReplying && (
            <CommentForm
              postId={postId}
              parentCommentId={comment.id}
              onCommentAdded={handleReplyAdded}
              onCancel={() => setIsReplying(false)}
              placeholder="Write a reply..."
              autoFocus
              isReply
            />
          )}
        </div>
      </div>
    </div>
  );
}
