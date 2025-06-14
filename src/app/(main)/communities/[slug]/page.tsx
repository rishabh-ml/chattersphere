"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useNavigation, routes } from "@/lib/navigation";
import { useSingleCommunity } from "@/context/SingleCommunityContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Hash,
  Volume2,
  Megaphone,
  ArrowRight,
  Plus,
  Folder,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import dynamic from "next/dynamic";

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigation = useNavigation();
  const { community, channels, loading, error, selectChannel } = useSingleCommunity();

  // Track if we've already redirected to prevent multiple redirects
  const [hasRedirected, setHasRedirected] = useState(false);

  // Redirect to the first channel when channels are loaded
  useEffect(() => {
    if (!loading && channels.length > 0 && !hasRedirected) {
      setHasRedirected(true);
      // Use a small timeout to prevent immediate redirect which can cause UI flicker
      const redirectTimer = setTimeout(() => {
        navigation.goToChannel(slug as string, channels[0].id);
      }, 100);

      return () => clearTimeout(redirectTimer);
    }
  }, [loading, channels, navigation, slug, hasRedirected]);

  // Group channels by type
  const groupedChannels = channels.reduce(
    (acc, channel) => {
      if (!acc[channel.type]) {
        acc[channel.type] = [];
      }
      acc[channel.type].push(channel);
      return acc;
    },
    {} as Record<string, typeof channels>
  );

  // Get channel icon based on type
  const getChannelIcon = (type: string) => {
    switch (type) {
      case "TEXT":
        return <Hash className="h-5 w-5 mr-2 text-gray-500" />;
      case "VOICE":
        return <Volume2 className="h-5 w-5 mr-2 text-gray-500" />;
      case "ANNOUNCEMENT":
        return <Megaphone className="h-5 w-5 mr-2 text-gray-500" />;
      default:
        return <Hash className="h-5 w-5 mr-2 text-gray-500" />;
    }
  };

  // Get category label
  const getCategoryLabel = (type: string) => {
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
  };

  // Memoize the loading state to prevent unnecessary re-renders
  const renderLoadingState = useCallback(
    () => (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Skeleton className="h-16 w-16 rounded-full mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48 mb-8" />
        <Skeleton className="h-10 w-40" />
      </div>
    ),
    []
  );

  if (loading) {
    return renderLoadingState();
  }

  if (error || !community) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-red-700">Community not found</h2>
          <p className="text-gray-600 mb-6">
            The community you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button
            variant="outline"
            className="mr-2 border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => navigation.goToExplore()}
          >
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 md:p-8">
        <div className="text-center max-w-2xl w-full">
          <h1 className="text-3xl font-bold mb-3">{community.name}</h1>
          <div className="prose prose-sm max-w-none mb-8 text-gray-600">
            {community.description}
          </div>

          <div className="bg-white rounded-lg border border-gray-100 p-8 mb-6 flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
              <Hash className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Channels Available</h2>
            <p className="text-gray-500 mb-6 max-w-md">
              This community doesn't have any channels yet.
              {community.isCreator || community.isModerator
                ? " As an admin, you can create the first channel to get started."
                : " Please check back later when the community admins have set up channels."}
            </p>
            {(community.isCreator || community.isModerator) && (
              <Button
                onClick={() => navigation.goToCommunity(community.slug, undefined, undefined)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Channel
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-8">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-3">{community.name}</h1>
        <div className="prose prose-sm max-w-none mb-8 text-gray-600">{community.description}</div>

        <div className="bg-white rounded-lg shadow-sm p-6 text-left w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Available Channels</h2>
            {(community.isCreator || community.isModerator) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigation.goToCommunity(community.slug, undefined, undefined)}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Channel
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {Object.entries(groupedChannels).map(([type, typeChannels]) => (
              <div key={type}>
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                  {getCategoryLabel(type)}
                </h3>

                <div className="space-y-2">
                  {typeChannels.map((channel) => (
                    <Button
                      key={channel.id}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => navigation.goToChannel(slug as string, channel.id)}
                    >
                      <div className="flex items-center">
                        {getChannelIcon(channel.type)}
                        <span>{channel.name}</span>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
