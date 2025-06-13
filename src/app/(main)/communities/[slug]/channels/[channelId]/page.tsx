"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useSingleCommunity } from "@/features/communities/contexts/SingleCommunityContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Hash, Volume2, Megaphone, Send, Image, Smile, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    name: string;
    image?: string;
  };
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export default function ChannelPage() {
  const { channelId } = useParams<{ slug: string; channelId: string }>();
  const {
    community,
    channels,
    selectedChannel,
    loading,
    error,
    selectChannel,
  } = useSingleCommunity();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Select the channel when the page loads
  useEffect(() => {
    if (channelId && channels.length > 0) {
      const channel = channels.find(c => c.id === channelId);
      if (channel) {
        selectChannel(channelId as string);
      }
    }
  }, [channelId, channels, selectChannel]);

  // Fetch messages when the channel changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChannel) return;
      
      setIsLoadingMessages(true);
      
      try {
        // In a real app, you would fetch messages from the API
        // For now, we'll use mock data
        const mockMessages: Message[] = [
          {
            id: "1",
            content: "Welcome to the channel!",
            author: {
              id: "1",
              username: "admin",
              name: "Admin",
              image: "",
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isEdited: false,
          },
          {
            id: "2",
            content: "This is a Discord-inspired channel interface.",
            author: {
              id: "2",
              username: "system",
              name: "System",
              image: "",
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isEdited: false,
          },
        ];
        
        setMessages(mockMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    fetchMessages();
  }, [selectedChannel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedChannel) return;
    
    setIsSendingMessage(true);
    
    try {
      // In a real app, you would send the message to the API
      // For now, we'll just add it to the local state
      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageContent,
        author: {
          id: "current-user",
          username: "currentuser",
          name: "Current User",
          image: "",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEdited: false,
      };
      
      setMessages([...messages, newMessage]);
      setMessageContent("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Get channel icon based on type
  const getChannelIcon = (type?: string) => {
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

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-16 w-3/4" />
        </div>
        <div className="p-4 border-t border-gray-200">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error || !community || !selectedChannel) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold mb-2">Channel not found</p>
          <p className="text-sm">The channel you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          {getChannelIcon(selectedChannel.type)}
          <h1 className="font-semibold text-lg">{selectedChannel.name}</h1>
          {selectedChannel.isPrivate && (
            <div className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
              Private
            </div>
          )}
        </div>
        {selectedChannel.description && (
          <p className="text-sm text-gray-500 mt-1 ml-7">
            {selectedChannel.description}
          </p>
        )}
      </div>
      
      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoadingMessages ? (
            <>
              <Skeleton className="h-16 w-full mb-4" />
              <Skeleton className="h-16 w-full mb-4" />
              <Skeleton className="h-16 w-3/4" />
            </>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-full p-4 inline-block mb-4">
                {getChannelIcon(selectedChannel.type)}
              </div>
              <h3 className="text-lg font-semibold">Welcome to #{selectedChannel.name}!</h3>
              <p className="text-gray-500 mt-1">
                This is the start of the {selectedChannel.name} channel.
              </p>
              {selectedChannel.description && (
                <p className="text-gray-500 mt-4 max-w-md mx-auto">
                  {selectedChannel.description}
                </p>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex group">
                <Avatar className="h-10 w-10 mr-3 mt-0.5">
                  {message.author.image ? (
                    <AvatarImage src={message.author.image} alt={message.author.name} />
                  ) : (
                    <AvatarFallback className="bg-indigo-600 text-white">
                      {message.author.name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-900">
                      {message.author.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {format(new Date(message.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    {message.isEdited && (
                      <span className="ml-1 text-xs text-gray-500">(edited)</span>
                    )}
                  </div>
                  
                  <div className="mt-1 text-gray-800">
                    {message.content}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Message input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 mx-2 relative">
            <Textarea
              placeholder={`Message #${selectedChannel.name}`}
              className="min-h-[44px] py-3 pr-12 resize-none"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="absolute right-3 top-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-gray-700"
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-gray-700"
              >
                <Image className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
            onClick={handleSendMessage}
            disabled={!messageContent.trim() || isSendingMessage}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
