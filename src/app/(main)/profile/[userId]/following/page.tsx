"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Following {
  id: string;
  username: string;
  name: string;
  image?: string;
  isFollowing: boolean;
}

export default function FollowingPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${userId}/following`);

        if (!res.ok) {
          throw new Error("Failed to fetch following");
        }

        const data = await res.json();
        setFollowing(data.following);
        setUsername(data.username);
        setError(null);
      } catch (err) {
        console.error("Error fetching following:", err);
        setError("Failed to load following. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [userId]);

  const handleFollowToggle = async (followingId: string) => {
    if (!isSignedIn) {
      toast.error("You must be signed in to follow users");
      return;
    }

    try {
      setFollowLoading((prev) => ({ ...prev, [followingId]: true }));

      const followingUser = following.find((f) => f.id === followingId);
      const isCurrentlyFollowing = followingUser?.isFollowing;

      const endpoint = isCurrentlyFollowing
        ? `/api/users/${followingId}/unfollow`
        : `/api/users/${followingId}/follow`;

      const method = isCurrentlyFollowing ? "DELETE" : "POST";

      const res = await fetch(endpoint, { method });

      if (!res.ok) {
        throw new Error("Failed to update follow status");
      }

      // Update the local state
      setFollowing((prev) =>
        prev.map((f) => (f.id === followingId ? { ...f, isFollowing: !isCurrentlyFollowing } : f))
      );

      toast.success(isCurrentlyFollowing ? "Unfollowed successfully" : "Followed successfully");
    } catch (err) {
      console.error("Follow toggle error:", err);
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading((prev) => ({ ...prev, [followingId]: false }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">
          {username ? `${username} is Following` : "Following"}
        </h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center p-4 bg-white rounded-lg shadow-sm">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="ml-4 space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-600">
          <p>{error}</p>
        </div>
      ) : following.length === 0 ? (
        <div className="bg-white p-8 rounded-lg text-center">
          <p className="text-gray-500">Not following anyone yet</p>
        </div>
      ) : (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {following.map((followingUser) => (
            <motion.div
              key={followingUser.id}
              className="flex items-center p-4 bg-white rounded-lg shadow-sm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={`/profile/${followingUser.id}`} className="flex items-center flex-1">
                <Avatar className="h-12 w-12">
                  <img
                    src={
                      followingUser.image ||
                      `https://placehold.co/200x200?text=${followingUser.name.charAt(0)}`
                    }
                    alt={followingUser.name}
                  />
                </Avatar>
                <div className="ml-4">
                  <p className="font-medium">{followingUser.name}</p>
                  <p className="text-sm text-gray-500">@{followingUser.username}</p>
                </div>
              </Link>

              {isSignedIn && (
                <Button
                  variant={followingUser.isFollowing ? "outline" : "default"}
                  size="sm"
                  disabled={followLoading[followingUser.id]}
                  onClick={() => handleFollowToggle(followingUser.id)}
                  className={
                    followingUser.isFollowing
                      ? "text-gray-600"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }
                >
                  {followLoading[followingUser.id] ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : followingUser.isFollowing ? (
                    "Unfollow"
                  ) : (
                    "Follow"
                  )}
                </Button>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
