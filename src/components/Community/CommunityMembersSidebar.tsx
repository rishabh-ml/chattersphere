"use client";

import React, { useState, useEffect } from "react";
import { useSingleCommunity } from "@/context/SingleCommunityContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function CommunityMembersSidebar() {
  const {
    community,
    members,
    loading,
    error,
    fetchMembers,
  } = useSingleCommunity();

  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMembers, setFilteredMembers] = useState(members);

  // Group members by role
  const groupedMembers = filteredMembers.reduce((acc, member) => {
    // Find the highest position role
    const highestRole = member.roles.reduce((highest, role) => {
      return role.position > highest.position ? role : highest;
    }, { position: -1, name: "", color: "" });

    const roleGroup = highestRole.name || "Members";
    
    if (!acc[roleGroup]) {
      acc[roleGroup] = [];
    }
    
    acc[roleGroup].push({
      ...member,
      highestRole,
    });
    
    return acc;
  }, {} as Record<string, any[]>);

  // Sort role groups by importance
  const sortedRoleGroups = Object.entries(groupedMembers).sort((a, b) => {
    // Creator and Moderator roles should be at the top
    if (a[0] === "Admin") return -1;
    if (b[0] === "Admin") return 1;
    if (a[0] === "Moderator") return -1;
    if (b[0] === "Moderator") return 1;
    return 0;
  });

  // Filter members when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMembers(
        members.filter(
          (member) =>
            member.user.name.toLowerCase().includes(query) ||
            member.user.username.toLowerCase().includes(query) ||
            (member.displayName && member.displayName.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, members]);

  // Fetch members when community changes
  useEffect(() => {
    if (community && community.id) {
      fetchMembers(community.id);
    }
  }, [community, fetchMembers]);

  if (!isExpanded) {
    return (
      <div className="w-10 bg-gray-100 border-l border-gray-200 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-200"
          onClick={() => setIsExpanded(true)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-60 bg-gray-100 border-l border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="p-3">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="w-60 bg-gray-100 border-l border-gray-200 flex flex-col p-4">
        <div className="text-red-500 text-sm">
          Error loading members
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 bg-gray-100 border-l border-gray-200 flex flex-col">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Members</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
          onClick={() => setIsExpanded(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search members"
            className="pl-8 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {members.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              No members found
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              No members match your search
            </div>
          ) : (
            sortedRoleGroups.map(([roleName, roleMembers]) => (
              <div key={roleName} className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                  {roleName} — {roleMembers.length}
                </div>
                
                <div className="mt-1 space-y-0.5">
                  {roleMembers.map((member) => (
                    <div
                      key={member.id}
                      className="px-2 py-1 rounded hover:bg-gray-200 flex items-center"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          {member.user.image ? (
                            <AvatarImage src={member.user.image} alt={member.user.name} />
                          ) : (
                            <AvatarFallback className="bg-indigo-600 text-white">
                              {member.user.name.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-gray-100" />
                      </div>
                      
                      <div className="ml-2 overflow-hidden">
                        <div className="text-sm font-medium text-gray-700 truncate">
                          {member.displayName || member.user.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          @{member.user.username}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
