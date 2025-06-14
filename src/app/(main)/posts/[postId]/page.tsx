"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useNavigation, routes } from "@/lib/navigation";
import PostCard from "@/components/post-card";
import CommentList from "@/components/comments/CommentList";
import { toast } from "sonner";
import { Post } from "@/context/PostContext";

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigation = useNavigation();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch post");
        }

        const data = await response.json();
        setPost(data.post);
      } catch (error) {
        console.error("Error fetching post:", error);
        setError("Failed to load post. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleVote = async (postId: string, voteType: "upvote" | "downvote") => {
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
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

      setPost((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          upvoteCount: data.voteStatus.upvoteCount,
          downvoteCount: data.voteStatus.downvoteCount,
          voteCount: data.voteStatus.voteCount,
          isUpvoted: data.voteStatus.isUpvoted,
          isDownvoted: data.voteStatus.isDownvoted,
        };
      });
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to vote on post");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600 my-6">
        <p>{error || "Post not found"}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={routes.home()} onClick={(e) => navigation.goToHome(e)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="text-gray-600">
          <Link href={routes.home()} onClick={(e) => navigation.goToHome(e)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <PostCard post={post} onVote={handleVote} />
      </div>

      <CommentList postId={post.id} />
    </div>
  );
}
