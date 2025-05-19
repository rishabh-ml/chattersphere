"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSingleCommunity } from "@/context/SingleCommunityContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Settings,
  Users,
  Bell,
  MoreVertical,
  LogOut,
  UserPlus,
  Shield,
  Menu,
  SidebarClose,
} from "lucide-react";

interface CommunityHeaderProps {
  onToggleChannels?: () => void;
  onToggleMembers?: () => void;
  isMobile?: boolean;
}

export default function CommunityHeader({
  onToggleChannels,
  onToggleMembers,
  isMobile = false
}: CommunityHeaderProps) {
  const router = useRouter();
  const {
    community,
    loading,
    error,
    joinCommunity,
    leaveCommunity,
  } = useSingleCommunity();

  const handleJoinCommunity = async () => {
    if (community) {
      await joinCommunity(community.id);
    }
  };

  const handleLeaveCommunity = async () => {
    if (community && confirm("Are you sure you want to leave this community?")) {
      const success = await leaveCommunity(community.id);
      if (success) {
        router.push("/communities");
      }
    }
  };

  if (loading) {
    return (
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>
    );
  }

  if (error || !community) {
    return (
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <Link href="/communities" className="text-gray-500 hover:text-gray-700">
            <Home className="h-5 w-5" />
          </Link>
          <span className="text-red-500">Error loading community</span>
        </div>
        <Button variant="outline" onClick={() => router.push("/communities")}>
          Back to Communities
        </Button>
      </header>
    );
  }

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 justify-between">
      <div className="flex items-center gap-3">
        {isMobile && onToggleChannels && (
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700 md:hidden"
            onClick={onToggleChannels}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <Link href="/communities" className="text-gray-500 hover:text-gray-700">
          <Home className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {community.image ? (
              <AvatarImage src={community.image} alt={community.name} loading="eager" />
            ) : (
              <AvatarFallback className="bg-indigo-600 text-white">
                {community.name.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>

          <h1 className="font-semibold text-lg truncate max-w-[150px] sm:max-w-xs">{community.name}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {community.isMember ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>

            {(community.isCreator || community.isModerator) && (
              <Button
                variant="outline"
                size="sm"
                className="text-gray-700 border-gray-300 hover:bg-gray-100"
                onClick={() => router.push(`/communities/${community.slug}/settings`)}
              >
                <Settings className="h-4 w-4 mr-1" />
                Community Settings
              </Button>
            )}

            {onToggleMembers ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700"
                title="Toggle Members"
                onClick={onToggleMembers}
              >
                <Users className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700"
                title="Members"
                onClick={() => router.push(`/communities/${community.slug}/members`)}
              >
                <Users className="h-5 w-5" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/communities/${community.slug}/invite`)}
                  className="cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite People
                </DropdownMenuItem>

                {(community.isCreator || community.isModerator) && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push(`/communities/${community.slug}/roles`)}
                      className="cursor-pointer"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Roles
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem
                  onClick={handleLeaveCommunity}
                  className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Community
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button
            onClick={handleJoinCommunity}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Join Community
          </Button>
        )}
      </div>
    </header>
  );
}
