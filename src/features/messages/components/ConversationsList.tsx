"use client";

import { useState, useEffect } from "react";
import { useMessagesContext } from "../contexts/MessagesContext";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Button } from "@/shared/ui/button";
import { Avatar } from "@/shared/ui/avatar";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Search, Loader2, Plus } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ConversationsList() {
  const {
    conversations,
    isLoadingConversations,
    refetchConversations,
  } = useMessagesContext();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const router = useRouter();
  
  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter(
      (conversation) =>
        conversation.participant.name.toLowerCase().includes(query) ||
        conversation.participant.username.toLowerCase().includes(query)
    );
    
    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);
  
  // Refresh conversations list periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchConversations();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [refetchConversations]);
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
        
        <div className="flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />            <Input
              placeholder="Search conversations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Link href="/messages/new" passHref>
            <Button size="icon" className="ml-2">
              <Plus className="h-5 w-5" />
              <span className="sr-only">New message</span>
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {isLoadingConversations ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            {searchQuery ? (
              <p className="text-gray-500">No conversations matching "{searchQuery}"</p>
            ) : (
              <>
                <p className="text-gray-500">No messages yet</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => router.push("/messages/new")}
                >
                  Start a new conversation
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.participant.id}`}
                passHref
              >
                <div
                  className={cn(
                    "p-4 transition-colors hover:bg-gray-50 cursor-pointer",
                    conversation.unreadCount > 0 && "bg-blue-50 hover:bg-blue-50"
                  )}
                >
                  <div className="flex items-start">
                    <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                      <img
                        src={conversation.participant.image || `/avatars/placeholder.png`}
                        alt={conversation.participant.name}
                      />
                    </Avatar>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3
                          className={cn(
                            "text-sm font-medium truncate",
                            conversation.unreadCount > 0
                              ? "text-gray-900 font-semibold"
                              : "text-gray-700"
                          )}
                        >
                          {conversation.participant.name}
                        </h3>
                        
                        <p className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {format(
                            new Date(conversation.lastMessage.createdAt),
                            new Date(conversation.lastMessage.createdAt).toDateString() ===
                              new Date().toDateString()
                              ? "h:mm a"
                              : "MMM d"
                          )}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p
                          className={cn(
                            "text-sm truncate",
                            conversation.unreadCount > 0
                              ? "text-gray-900 font-medium"
                              : "text-gray-500"
                          )}
                        >
                          {conversation.lastMessage.content}
                        </p>
                        
                        {conversation.unreadCount > 0 && (
                          <Badge variant="primary" className="ml-2 whitespace-nowrap">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
