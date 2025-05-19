"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MessageSquare, ThumbsUp, ThumbsDown, Bookmark, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import DeletePostButton from "./DeletePostButton";
import { useUser } from "@clerk/nextjs";

interface Author {
  id: string;
  username: string;
  name: string;
  image?: string;
}

interface Community {
  id: string;
  name: string;
  slug: string;
}

interface PostCardProps {
  id: string;
  content: string;
  author: Author;
  community: Community;
  createdAt: string;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  isSaved?: boolean;
  userRole?: string;
  onVote?: (postId: string, voteType: "upvote" | "downvote") => Promise<void>;
  onSave?: (postId: string) => Promise<void>;
  onDelete?: () => void;
}

export default function PostCard({
  id,
  content,
  author,
  community,
  createdAt,
  upvoteCount,
  downvoteCount,
  commentCount,
  isUpvoted = false,
  isDownvoted = false,
  isSaved = false,
  userRole,
  onVote,
  onSave,
  onDelete,
}: PostCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localIsUpvoted, setLocalIsUpvoted] = useState(isUpvoted);
  const [localIsDownvoted, setLocalIsDownvoted] = useState(isDownvoted);
  const [localIsSaved, setLocalIsSaved] = useState(isSaved);
  const [localUpvoteCount, setLocalUpvoteCount] = useState(upvoteCount);
  const [localDownvoteCount, setLocalDownvoteCount] = useState(downvoteCount);
  const { user } = useUser();

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (isVoting || !onVote) return;

    setIsVoting(true);

    try {
      await onVote(id, voteType);

      if (voteType === "upvote") {
        if (localIsUpvoted) {
          // Removing upvote
          setLocalUpvoteCount((prev) => prev - 1);
          setLocalIsUpvoted(false);
        } else {
          // Adding upvote
          setLocalUpvoteCount((prev) => prev + 1);
          setLocalIsUpvoted(true);

          // If post was downvoted, remove the downvote
          if (localIsDownvoted) {
            setLocalDownvoteCount((prev) => prev - 1);
            setLocalIsDownvoted(false);
          }
        }
      } else {
        if (localIsDownvoted) {
          // Removing downvote
          setLocalDownvoteCount((prev) => prev - 1);
          setLocalIsDownvoted(false);
        } else {
          // Adding downvote
          setLocalDownvoteCount((prev) => prev + 1);
          setLocalIsDownvoted(true);

          // If post was upvoted, remove the upvote
          if (localIsUpvoted) {
            setLocalUpvoteCount((prev) => prev - 1);
            setLocalIsUpvoted(false);
          }
        }
      }
    } catch (error) {
      console.error(`Error ${voteType}ing post:`, error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleSave = async () => {
    if (isSaving || !onSave) return;

    setIsSaving(true);

    try {
      await onSave(id);
      setLocalIsSaved(!localIsSaved);
    } catch (error) {
      console.error("Error saving post:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mb-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <img
                src={author.image || `https://placehold.co/200x200?text=${author.name.charAt(0)}`}
                alt={author.name}
              />
            </Avatar>
            <div>
              <div className="flex items-center">
                <Link href={`/profile/${author.id}`} className="font-medium text-gray-900 hover:underline">
                  {author.name}
                </Link>
                <span className="mx-1 text-gray-500">•</span>
                <Link href={`/communities/${community.slug}`} className="text-[#00AEEF] hover:underline">
                  {community.name}
                </Link>
              </div>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {user && (
            <DeletePostButton
              postId={id}
              authorId={author.id}
              currentUserId={user.id}
              userRole={userRole}
              size="sm"
              onDeleted={onDelete}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 py-2">
        <Link href={`/posts/${id}`}>
          <p className="text-gray-800 whitespace-pre-wrap">{content}</p>
        </Link>
      </CardContent>
      <CardFooter className="px-4 py-2 border-t border-gray-100 flex justify-between">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-gray-500 hover:text-[#00AEEF] hover:bg-blue-50",
              localIsUpvoted && "text-[#00AEEF] bg-blue-50"
            )}
            onClick={() => handleVote("upvote")}
            disabled={isVoting}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            <span>{localUpvoteCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-gray-500 hover:text-red-500 hover:bg-red-50",
              localIsDownvoted && "text-red-500 bg-red-50"
            )}
            onClick={() => handleVote("downvote")}
            disabled={isVoting}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            <span>{localDownvoteCount}</span>
          </Button>
          <Link href={`/posts/${id}`}>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span>{commentCount}</span>
            </Button>
          </Link>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-gray-500 hover:text-[#00AEEF] hover:bg-blue-50",
              localIsSaved && "text-[#00AEEF] bg-blue-50"
            )}
            onClick={handleSave}
            disabled={isSaving}
          >
            <Bookmark className="h-4 w-4 mr-1" />
            <span>{localIsSaved ? "Saved" : "Save"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/posts/${id}`);
            }}
          >
            <Share2 className="h-4 w-4 mr-1" />
            <span>Share</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
