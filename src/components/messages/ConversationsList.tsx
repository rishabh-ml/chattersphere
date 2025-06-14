"use client";

import { useState } from "react";
import { useDirectMessages, Conversation } from "@/context/DirectMessageContext";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, MessageSquare, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function ConversationsList() {
  const {
    conversations,
    activeConversation,
    isLoadingConversations,
    fetchConversations,
    setActiveConversation,
  } = useDirectMessages();

  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle conversation click
  const handleConversationClick = (conversation: Conversation) => {
    setActiveConversation(conversation.userId);
    router.push(`/messages/${conversation.userId}`);
  };

  // Handle new message click
  const handleNewMessageClick = () => {
    router.push("/messages/new");
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-[#00AEEF]" />
          Messages
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            className="pl-9 bg-gray-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-2">
        <Button
          onClick={handleNewMessageClick}
          className="w-full bg-[#00AEEF] hover:bg-[#0099d6] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoadingConversations ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-[#00AEEF]" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.userId}
                className={cn(
                  "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                  activeConversation === conversation.userId ? "bg-blue-50" : "hover:bg-gray-50"
                )}
                onClick={() => handleConversationClick(conversation)}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <img
                    src={
                      conversation.image ||
                      `https://placehold.co/200x200?text=${conversation.name.charAt(0)}`
                    }
                    alt={conversation.name}
                  />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm truncate">{conversation.name}</h3>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                        addSuffix: false,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
                    {conversation.unreadCount > 0 && (
                      <Badge className="ml-2 bg-[#00AEEF]">{conversation.unreadCount}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
