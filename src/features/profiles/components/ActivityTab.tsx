"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Post, Comment } from "@/types";
import { MessageSquare, ThumbsUp, ThumbsDown, Calendar, Users, Hash } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ActivityTabProps {
  userId: string;
}

export default function ActivityTab({ userId }: ActivityTabProps) {
  const router = useRouter();
  const [activityType, setActivityType] = useState<"posts" | "comments" | "communities">("posts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    hasMore: false,
  });

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/profile/${userId}/activity?type=${activityType}&page=${pagination.page}&limit=${pagination.limit}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch activity");
      }

      const data = await res.json();

      if (activityType === "posts") {
        setPosts(data.posts || []);
      } else if (activityType === "comments") {
        setComments(data.comments || []);
      } else if (activityType === "communities") {
        setCommunities(data.communities || []);
      }

      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching activity:", err);
      setError("Failed to load activity. Please try again.");
      toast.error("Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [userId, activityType, pagination.page, pagination.limit]);

  // Use the memoized fetch function in useEffect
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const loadMore = () => {
    setPagination((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
  };

  const handleTabChange = (value: string) => {
    setActivityType(value as "posts" | "comments" | "communities");
    setPagination({
      page: 1,
      limit: 10,
      totalItems: 0,
      hasMore: false,
    });
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="mb-6">
        <Tabs
          defaultValue="posts"
          value={activityType}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading && pagination.page === 1 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : activityType === "posts" && posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No posts yet</p>
        </div>
      ) : activityType === "comments" && comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No comments yet</p>
        </div>
      ) : activityType === "communities" && communities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No communities joined yet</p>
        </div>
      ) : activityType === "posts" ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors cursor-pointer"
              onClick={() => router.push(`/post/${post.id}`)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm text-gray-500 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(post.createdAt), "MMM d, yyyy")}
                </div>
                {post.community && (
                  <div className="text-sm">
                    in <span className="font-medium text-indigo-600">{post.community.name}</span>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <p className="line-clamp-3">{post.content}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {post.commentCount}
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className={`h-4 w-4 ${post.isUpvoted ? "text-green-500" : ""}`} />
                  {post.upvoteCount}
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown className={`h-4 w-4 ${post.isDownvoted ? "text-red-500" : ""}`} />
                  {post.downvoteCount}
                </div>
              </div>
            </div>
          ))}

          {pagination.hasMore && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : activityType === "communities" ? (
        <div className="space-y-4">
          {communities.map((community) => (
            <div
              key={community.id}
              className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors cursor-pointer"
              onClick={() => router.push(`/community/${community.slug}`)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {community.image ? (
                    <img
                      src={community.image}
                      alt={community.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-lg font-semibold">
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Avatar>

                <div>
                  <h3 className="font-medium text-gray-900">{community.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Hash className="h-3 w-3" />
                    <span>{community.slug}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600 line-clamp-2">{community.description}</div>

              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {community.memberCount} {community.memberCount === 1 ? "member" : "members"}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {community.postCount} {community.postCount === 1 ? "post" : "posts"}
                </div>
                <div className="text-xs">
                  Joined{" "}
                  {format(new Date(community.joinedAt || community.createdAt), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          ))}

          {pagination.hasMore && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors cursor-pointer"
              onClick={() => router.push(`/post/${comment.post}`)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm text-gray-500 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(comment.createdAt), "MMM d, yyyy")}
                </div>
                <div className="text-sm">
                  on <span className="font-medium text-indigo-600">a post</span>
                </div>
              </div>

              <div className="mb-3">
                <p className="line-clamp-2">{comment.content}</p>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <ThumbsUp className={`h-4 w-4 ${comment.isUpvoted ? "text-green-500" : ""}`} />
                  {comment.upvoteCount}
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown className={`h-4 w-4 ${comment.isDownvoted ? "text-red-500" : ""}`} />
                  {comment.downvoteCount}
                </div>
              </div>
            </div>
          ))}

          {pagination.hasMore && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
