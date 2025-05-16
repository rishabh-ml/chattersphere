"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSingleCommunity } from "@/context/SingleCommunityContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Hash, Volume2, Megaphone, ArrowRight } from "lucide-react";

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const {
    community,
    channels,
    loading,
    error,
    selectChannel,
  } = useSingleCommunity();

  // Redirect to the first channel when channels are loaded
  useEffect(() => {
    if (!loading && channels.length > 0) {
      router.push(`/communities/${slug}/channels/${channels[0].id}`);
    }
  }, [loading, channels, router, slug]);

  // Group channels by type
  const groupedChannels = channels.reduce((acc, channel) => {
    if (!acc[channel.type]) {
      acc[channel.type] = [];
    }
    acc[channel.type].push(channel);
    return acc;
  }, {} as Record<string, typeof channels>);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Skeleton className="h-16 w-16 rounded-full mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48 mb-8" />
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold mb-2">Community not found</p>
          <p className="text-sm">The community you're looking for doesn't exist or you don't have access to it.</p>
        </div>
        <Button
          className="mt-6"
          onClick={() => router.push("/communities")}
        >
          Back to Communities
        </Button>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">{community.name}</h1>
          <p className="text-gray-500 mb-6">{community.description}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800">
              This community doesn't have any channels yet.
              {community.isCreator || community.isModerator ? (
                " Create a channel to get started."
              ) : (
                " Please check back later."
              )}
            </p>
          </div>
          {(community.isCreator || community.isModerator) && (
            <Button
              onClick={() => router.push(`/communities/${community.slug}/settings/channels`)}
            >
              Create Channel
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-2">{community.name}</h1>
        <p className="text-gray-500 mb-6">{community.description}</p>
        
        <div className="bg-white rounded-lg shadow-sm p-6 text-left">
          <h2 className="text-lg font-semibold mb-4">Available Channels</h2>
          
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
                      onClick={() => router.push(`/communities/${slug}/channels/${channel.id}`)}
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
