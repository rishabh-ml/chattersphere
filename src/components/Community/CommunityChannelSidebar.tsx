"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSingleCommunity } from "@/context/SingleCommunityContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Hash,
  Volume2,
  Megaphone,
  Plus,
  Settings,
  Lock,
  ChevronDown,
  ChevronRight,
  SidebarClose,
} from "lucide-react";
import { toast } from "sonner";

interface CommunityChannelSidebarProps {
  onClose?: () => void;
}

export default function CommunityChannelSidebar({ onClose }: CommunityChannelSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    community,
    channels,
    selectedChannel,
    loading,
    error,
    fetchChannels,
    selectChannel,
    createChannel,
  } = useSingleCommunity();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [newChannelType, setNewChannelType] = useState("TEXT");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "TEXT": true,
    "VOICE": true,
    "ANNOUNCEMENT": true,
  });

  // Group channels by type - memoized to prevent unnecessary recalculations
  const groupedChannels = useMemo(() => {
    return channels.reduce((acc, channel) => {
      if (!acc[channel.type]) {
        acc[channel.type] = [];
      }
      acc[channel.type].push(channel);
      return acc;
    }, {} as Record<string, typeof channels>);
  }, [channels]);

  // Handle channel selection - memoized to prevent unnecessary recreations
  const handleChannelSelect = useCallback((channelId: string) => {
    selectChannel(channelId);
    router.push(`/communities/${community?.slug}/channels/${channelId}`);
  }, [selectChannel, router, community?.slug]);

  // Handle channel creation - memoized to prevent unnecessary recreations
  const handleCreateChannel = useCallback(async () => {
    if (!newChannelName.trim()) {
      toast.error("Channel name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const newChannel = await createChannel({
        name: newChannelName.trim(),
        description: newChannelDescription.trim(),
        type: newChannelType as "TEXT" | "VOICE" | "ANNOUNCEMENT",
        isPrivate: newChannelPrivate,
      });

      if (newChannel) {
        setIsCreateDialogOpen(false);
        setNewChannelName("");
        setNewChannelDescription("");
        setNewChannelType("TEXT");
        setNewChannelPrivate(false);

        // Navigate to the new channel
        router.push(`/communities/${community?.slug}/channels/${newChannel.id}`);
      }
    } catch (error) {
      console.error("Error creating channel:", error);
      toast.error("Failed to create channel");
    } finally {
      setIsSubmitting(false);
    }
  }, [newChannelName, newChannelDescription, newChannelType, newChannelPrivate, createChannel, community?.slug, router]);

  // Toggle category expansion - memoized to prevent unnecessary recreations
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  // Get channel icon based on type - memoized to prevent unnecessary recreations
  const getChannelIcon = useCallback((type: string) => {
    switch (type) {
      case "TEXT":
        return <Hash className="h-4 w-4 mr-2 text-gray-500" />;
      case "VOICE":
        return <Volume2 className="h-4 w-4 mr-2 text-gray-500" />;
      case "ANNOUNCEMENT":
        return <Megaphone className="h-4 w-4 mr-2 text-gray-500" />;
      default:
        return <Hash className="h-4 w-4 mr-2 text-gray-500" />;
    }
  }, []);

  // Get category label - memoized to prevent unnecessary recreations
  const getCategoryLabel = useCallback((type: string) => {
    switch (type) {
      case "TEXT":
        return "Text Channels";
      case "VOICE":
        return "Voice Channels";
      case "ANNOUNCEMENT":
        return "Announcements";
      default:
        return type;
    }
  }, []);

  if (loading) {
    return (
      <div className="w-60 bg-gray-100 border-r border-gray-200 flex flex-col">
        <div className="p-3">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="w-60 bg-gray-100 border-r border-gray-200 flex flex-col p-4">
        <div className="text-red-500 text-sm">
          Error loading channels
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-60 bg-gray-100 border-r border-gray-200 flex flex-col fixed md:relative inset-0 z-40 md:z-0">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Channels</h2>

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-200 md:hidden"
            onClick={onClose}
          >
            <SidebarClose className="h-4 w-4" />
          </Button>
        )}

        {(community.isCreator || community.isModerator) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Channel</DialogTitle>
                <DialogDescription>
                  Add a new channel to your community. Channels are where members can communicate with each other.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Channel Name</Label>
                  <Input
                    id="name"
                    placeholder="general"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this channel about?"
                    value={newChannelDescription}
                    onChange={(e) => setNewChannelDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Channel Type</Label>
                  <Select
                    value={newChannelType}
                    onValueChange={setNewChannelType}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select channel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Text Channel</SelectItem>
                      <SelectItem value="VOICE">Voice Channel</SelectItem>
                      <SelectItem value="ANNOUNCEMENT">Announcement Channel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="private">Private Channel</Label>
                    <p className="text-sm text-gray-500">
                      Only specific members and roles can access
                    </p>
                  </div>
                  <Switch
                    id="private"
                    checked={newChannelPrivate}
                    onCheckedChange={setNewChannelPrivate}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateChannel}
                  disabled={!newChannelName.trim() || isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Channel"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.keys(groupedChannels).length === 0 ? (
            <div className="text-center py-10 px-4 border rounded-lg my-4 bg-gray-50">
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <Hash className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">No channels have been created in this community.</h3>
              {(community.isCreator || community.isModerator) ? (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="outline"
                  className="mt-3"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Channel
                </Button>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Check back later for new channels.</p>
              )}
            </div>
          ) : (
            Object.entries(groupedChannels).map(([type, typeChannels]) => (
              <div key={type} className="mb-4">
                <div
                  className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                  onClick={() => toggleCategory(type)}
                >
                  {expandedCategories[type] ? (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1" />
                  )}
                  {getCategoryLabel(type)}
                </div>

                {expandedCategories[type] && (
                  <div className="mt-1 space-y-0.5">
                    {typeChannels.map((channel) => (
                      <button
                        key={channel.id}
                        className={`w-full text-left px-2 py-1 rounded flex items-center text-sm ${
                          selectedChannel?.id === channel.id
                            ? "bg-gray-200 text-gray-900"
                            : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                        }`}
                        onClick={() => handleChannelSelect(channel.id)}
                      >
                        {getChannelIcon(channel.type)}
                        <span className="truncate">{channel.name}</span>
                        {channel.isPrivate && (
                          <Lock className="h-3 w-3 ml-1 text-gray-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {community.isMember && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-200"
            onClick={() => router.push(`/communities/${community.slug}/settings`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Community Settings
          </Button>
        </div>
      )}
    </div>
  );
}
