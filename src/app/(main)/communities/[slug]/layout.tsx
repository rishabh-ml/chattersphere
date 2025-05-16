"use client";

import React from "react";
import { useParams } from "next/navigation";
import { SingleCommunityProvider } from "@/context/SingleCommunityContext";
import CommunityHeader from "@/components/Community/CommunityHeader";
import CommunityChannelSidebar from "@/components/Community/CommunityChannelSidebar";
import CommunityMembersSidebar from "@/components/Community/CommunityMembersSidebar";
import ErrorBoundary from "@/components/error-boundary";

interface CommunityLayoutProps {
  children: React.ReactNode;
}

export default function CommunityLayout({ children }: CommunityLayoutProps) {
  const { slug } = useParams<{ slug: string }>();
  
  return (
    <ErrorBoundary>
      <SingleCommunityProvider initialCommunitySlug={slug as string}>
        <div className="flex flex-col h-screen">
          <CommunityHeader />
          
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar - Channels */}
            <CommunityChannelSidebar />
            
            {/* Main content area */}
            <main className="flex-1 overflow-y-auto bg-gray-50">
              {children}
            </main>
            
            {/* Right sidebar - Members */}
            <CommunityMembersSidebar />
          </div>
        </div>
      </SingleCommunityProvider>
    </ErrorBoundary>
  );
}
