"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User } from "@/types";
import ProfileHeader from "@/features/profiles/components/ProfileHeader";
import ProfileTabs from "@/features/profiles/components/ProfileTabs";
import ErrorBoundary from "@/components/error-boundary";
import { useFetch } from "@/hooks/useFetch";
import { sanitizeInput } from "@/lib/security";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { user: clerkUser, isSignedIn } = useUser();
  const [followLoading, setFollowLoading] = useState(false);
  // Add state for user to fix the missing setUser issue
  const [userState, setUserState] = useState<User | null>(null);

  // Sanitize userId to prevent injection attacks
  const sanitizedUserId = userId ? sanitizeInput(userId.toString()) : null;

  // Use our optimized fetch hook for data fetching with retries
  const {
    data: profileData,
    loading,
    error: fetchError,
    refetch,
  } = useFetch<{ profile: User }>(sanitizedUserId ? `/api/profile/${sanitizedUserId}` : "", {
    retries: 2,
    retryDelay: 1000,
  }); // Update userState when profileData changes
  useEffect(() => {
    if (profileData?.profile) {
      setUserState(profileData.profile);
    }
  }, [profileData]);

  // Use userState instead of directly accessing profileData
  const user = userState;
  const error = fetchError?.message || (!sanitizedUserId ? "Invalid or missing userId" : null);

  // Log profile view for analytics
  useEffect(() => {
    // Only log if we have both the viewer and profile owner IDs
    if (user && clerkUser && user.id !== clerkUser.id) {
      const logProfileView = async () => {
        try {
          await fetch(`/api/analytics/profile-view`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              profileId: user.id,
            }),
          });
          // We don't need to do anything with the response
          // This is just for analytics purposes
        } catch (err) {
          // Silently fail - analytics should not affect user experience
          console.error("Failed to log profile view:", err);
        }
      };

      logProfileView();
    }
  }, [user, clerkUser]);

  // Check if the current user is the profile owner
  const isOwner = isSignedIn && user?.clerkId === clerkUser?.id;

  const handleFollowToggle = async () => {
    if (!user || !isSignedIn) {
      toast.error("You must be signed in to follow users");
      return;
    }

    try {
      setFollowLoading(true);
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to toggle follow status");
      }

      setUserState((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: !prev.isFollowing,
              followerCount: prev.isFollowing ? prev.followerCount - 1 : prev.followerCount + 1,
            }
          : null
      );

      toast.success(user.isFollowing ? "Unfollowed successfully" : "Followed successfully");
    } catch (err) {
      console.error("Follow toggle error:", err);
      toast.error((err as Error).message || "Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user || !isOwner) {
      toast.error("You can only update your own profile");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`/api/profile/${userId}/avatar`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload avatar");
      }

      const data = await res.json();
      setUserState((prev) => (prev ? { ...prev, image: data.avatarUrl } : null));
    } catch (err) {
      console.error("Avatar upload error:", err);
      throw err; // Re-throw to be handled by the component
    }
  };

  const handleProfileUpdate = async (data: any) => {
    if (!user || !isOwner) {
      toast.error("You can only update your own profile");
      return;
    }

    try {
      const res = await fetch(`/api/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const responseData = await res.json();
      setUserState((prev) => (prev ? { ...prev, ...responseData.profile } : null));
    } catch (err) {
      console.error("Profile update error:", err);
      throw err; // Re-throw to be handled by the component
    }
  };

  const handlePrivacyUpdate = async (data: any) => {
    if (!user || !isOwner) {
      toast.error("You can only update your own privacy settings");
      return;
    }

    try {
      const res = await fetch(`/api/profile/${userId}/privacy`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update privacy settings");
      }

      const responseData = await res.json();
      setUserState((prev) =>
        prev ? { ...prev, privacySettings: responseData.privacySettings } : null
      );
    } catch (err) {
      console.error("Privacy settings update error:", err);
      throw err; // Re-throw to be handled by the component
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <Skeleton className="h-48 w-full rounded-lg mb-[-48px]" />
        <div className="relative px-6 pb-6 pt-12 flex flex-col md:flex-row gap-6">
          <Skeleton className="h-28 w-28 rounded-full border-4 border-white" />
          <div className="flex-1 mt-12 md:mt-0 md:ml-32">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-4 w-full max-w-md mb-2" />
            <Skeleton className="h-4 w-3/4 max-w-md" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-amber-800">Profile Not Found</h2>
          <p className="text-sm text-amber-600 mt-2">
            {error ?? "This user does not exist or has been removed."}
          </p>
          <Button
            variant="outline"
            className="mt-4 border-amber-300 text-amber-800 hover:bg-amber-100"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto pb-12"
      >
        <ProfileHeader
          user={user}
          isOwner={isOwner || false}
          onAvatarUpload={handleAvatarUpload}
          onFollowToggle={handleFollowToggle}
          followLoading={followLoading}
        />

        <ProfileTabs
          user={user}
          isOwner={isOwner || false}
          onProfileUpdate={handleProfileUpdate}
          onPrivacyUpdate={handlePrivacyUpdate}
        />
      </motion.div>
    </ErrorBoundary>
  );
}
