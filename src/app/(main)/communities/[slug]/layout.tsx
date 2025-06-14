"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SingleCommunityProvider } from "@/context/SingleCommunityContext";
import CommunityHeader from "@/features/communities/components/CommunityHeader";
import CommunityChannelSidebar from "@/features/communities/components/CommunityChannelSidebar";
import CommunityMembersSidebar from "@/features/communities/components/CommunityMembersSidebar";
import ErrorBoundary from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import { Menu, Users } from "lucide-react";

interface CommunityLayoutProps {
  children: React.ReactNode;
}

export default function CommunityLayout({ children }: CommunityLayoutProps) {
  const { slug } = useParams<{ slug: string }>();
  const [showChannelSidebar, setShowChannelSidebar] = useState(true);
  const [showMembersSidebar, setShowMembersSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowChannelSidebar(false);
        setShowMembersSidebar(false);
      } else if (window.innerWidth < 1024) {
        setShowChannelSidebar(true);
        setShowMembersSidebar(false);
      } else {
        setShowChannelSidebar(true);
        setShowMembersSidebar(true);
      }
    };

    // Initial check
    checkMobile();

    // Add event listener
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!slug) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-xl font-semibold mb-2">Community Not Found</h2>
          <p className="text-gray-600 mb-6">
            The community you're looking for doesn't exist or the URL is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Error Loading Community</h2>
            <p className="text-gray-600 mb-6">
              There was a problem loading this community. Please try again later.
            </p>
          </div>
        </div>
      }
    >
      <SingleCommunityProvider initialCommunitySlug={slug}>
        {/* Community-specific content that fits within the main layout */}
        <div className="flex flex-col h-full">
          <CommunityHeader
            onToggleChannels={() => setShowChannelSidebar(!showChannelSidebar)}
            onToggleMembers={() => setShowMembersSidebar(!showMembersSidebar)}
            isMobile={isMobile}
          />

          <div className="flex flex-1 overflow-hidden relative max-w-screen-xl mx-auto w-full">
            {/* Mobile sidebar toggle buttons */}
            {isMobile && (
              <div className="fixed bottom-24 left-4 z-30 flex gap-2">
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full shadow-md bg-white hover:bg-gray-50"
                  onClick={() => setShowChannelSidebar(!showChannelSidebar)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full shadow-md bg-white hover:bg-gray-50"
                  onClick={() => setShowMembersSidebar(!showMembersSidebar)}
                >
                  <Users className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Left sidebar - Channels */}
            {showChannelSidebar && (
              <CommunityChannelSidebar onClose={() => isMobile && setShowChannelSidebar(false)} />
            )}

            {/* Main content area */}
            <div className="flex-1 overflow-y-auto bg-gray-50">{children}</div>

            {/* Right sidebar - Members */}
            {showMembersSidebar && (
              <CommunityMembersSidebar onClose={() => isMobile && setShowMembersSidebar(false)} />
            )}
          </div>
        </div>
      </SingleCommunityProvider>
    </ErrorBoundary>
  );
}
