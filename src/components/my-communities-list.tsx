"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useNavigation, routes } from "@/lib/navigation";
import { Loader2, PlusCircle } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { toast } from "sonner";

interface Community {
  id: string;
  name: string;
  slug: string;
  image?: string;
  color: string;
}

export default function MyCommunities() {
  const { isSignedIn, isLoaded } = useUser();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Generate a color based on the community name
  const getColorForCommunity = (name: string): string => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-amber-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500"
    ];

    // Use the sum of character codes to determine the color
    const sum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  // Fetch user's communities
  useEffect(() => {
    const fetchMyCommunities = async () => {
      if (!isLoaded || !isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/communities/my-communities");

        if (!response.ok) {
          throw new Error("Failed to fetch communities");
        }

        const data = await response.json();

        // Format the communities with colors
        const formattedCommunities = data.communities.map((community: any) => ({
          id: community.id,
          name: community.name,
          slug: community.slug || community.name.toLowerCase().replace(/\s+/g, '-'),
          image: community.image,
          color: getColorForCommunity(community.name)
        }));

        setCommunities(formattedCommunities);
      } catch (error) {
        console.error("Error fetching communities:", error);
        // Fallback to mock data if API fails
        setCommunities([
          { id: '1', name: 'WebDev', slug: 'webdev', color: 'bg-blue-500' },
          { id: '2', name: 'TechTalk', slug: 'techtalk', color: 'bg-purple-500' },
          { id: '3', name: 'RemoteWork', slug: 'remotework', color: 'bg-green-500' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCommunities();
  }, [isSignedIn, isLoaded]);

  // Handle community click
  const handleCommunityClick = (slug: string) => {
    navigation.goToCommunity(slug);
  };

  // Handle create community click
  const handleCreateCommunity = () => {
    navigation.goToCreateCommunity();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        <p className="mb-2">No communities yet</p>
        <button
          onClick={handleCreateCommunity}
          className="text-[#00AEEF] hover:text-[#0099d6] flex items-center text-xs"
        >
          <PlusCircle className="h-3 w-3 mr-1" />
          Create or join one
        </button>
      </div>
    );
  }

  return (
    <>
      {communities.map((community) => (
        <SidebarMenuItem key={community.id}>
          <SidebarMenuButton
            className="hover:bg-blue-50 hover:text-[#00AEEF] transition-colors"
            onClick={() => handleCommunityClick(community.slug)}
          >
            <div className={`h-5 w-5 rounded-full ${community.color} flex items-center justify-center mr-3`}>
              <span className="text-white text-xs font-bold">{community.name.charAt(0)}</span>
            </div>
            <span className="truncate">{community.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
}
