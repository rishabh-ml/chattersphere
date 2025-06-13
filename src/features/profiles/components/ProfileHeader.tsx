"use client";

import { useState } from "react";
import { useNavigation, routes } from "@/lib/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Share2, User, Users, Calendar, MapPin, Globe, Edit, Upload } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { User as UserType } from "@/types";

interface ProfileHeaderProps {
  user: UserType;
  isOwner: boolean;
  onAvatarUpload: (file: File) => Promise<void>;
  onFollowToggle: () => Promise<void>;
  followLoading: boolean;
}

export default function ProfileHeader({
  user,
  isOwner,
  onAvatarUpload,
  onFollowToggle,
  followLoading,
}: ProfileHeaderProps) {
  const navigation = useNavigation();
  const { isSignedIn } = useUser();
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Supported formats: JPEG, PNG, WEBP, GIF");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 5MB");
      return;
    }

    try {
      setIsUploading(true);
      await onAvatarUpload(file);
      toast.success("Avatar updated successfully");
    } catch (error) {
      toast.error("Failed to update avatar");
      console.error("Avatar upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleShareProfile = () => {
    if (typeof navigator.share === 'function') {
      navigator.share({
        title: `${user.name}'s Profile on ChatterSphere`,
        text: `Check out ${user.name}'s profile on ChatterSphere!`,
        url: window.location.href,
      }).catch((error) => {
        console.error('Error sharing:', error);
        copyProfileLink();
      });
    } else {
      copyProfileLink();
    }
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied to clipboard");
  };

  return (
    <>
      {/* Profile Banner */}
      <div className="relative h-48 md:h-64 w-full bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-400 rounded-b-lg overflow-hidden" />

      {/* Profile Header */}
      <div className="relative px-4 md:px-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mt-[-64px]"
        >
          <div className="relative group">
            <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-white shadow-md">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-4xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>

            {isOwner && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <label htmlFor="avatar-upload" className="cursor-pointer flex items-center justify-center w-full h-full">
                  <Upload className="h-6 w-6 text-white" />
                  <span className="sr-only">Upload avatar</span>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={isUploading}
                />
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500 flex items-center gap-1 flex-wrap">
                <span>@{user.username}</span>
                <span className="text-gray-300 px-1">•</span>
                <span className="text-sm flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {user.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'recently'}
                </span>
              </p>

              {/* Location and Website */}
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{user.location}</span>
                  </div>
                )}

                {user.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      {new URL(user.website).hostname}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4 md:mt-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      onClick={handleShareProfile}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share profile</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isOwner ? (
                <Button
                  onClick={() => router.push(`/profile/${user.id}/edit`)}
                  variant="outline"
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                </Button>
              ) : isSignedIn ? (
                <Button
                  disabled={followLoading}
                  onClick={onFollowToggle}
                  className={user.isFollowing
                    ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
                  }
                >
                  {followLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  ) : null}
                  {user.isFollowing ? "Unfollow" : "Follow"}
                </Button>
              ) : null}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mt-4 text-gray-700">
              <p>{user.bio}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-3 md:gap-6 mt-6">
            <Button
              variant="ghost"
              className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200"
              onClick={() => navigation.goToFollowers(user.id)}
            >
              <User className="h-3.5 w-3.5 mr-1 text-indigo-500" />
              <span className="font-semibold text-indigo-700">{user.followerCount}</span>
              <span className="ml-1">Followers</span>
            </Button>
            <Button
              variant="ghost"
              className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200"
              onClick={() => navigation.goToFollowing(user.id)}
            >
              <User className="h-3.5 w-3.5 mr-1 text-indigo-500" />
              <span className="font-semibold text-indigo-700">{user.followingCount}</span>
              <span className="ml-1">Following</span>
            </Button>
            <Badge variant="secondary" className="px-4 py-2 rounded-full">
              <Users className="h-3.5 w-3.5 mr-1 text-indigo-500" />
              <span className="font-semibold text-indigo-700">{user.communityCount}</span> Communities
            </Badge>
          </div>
        </motion.div>
      </div>
    </>
  );
}
