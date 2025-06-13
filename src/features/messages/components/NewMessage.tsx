"use client";

import { useState, useEffect } from "react";
import { useMessagesContext } from "../contexts/MessagesContext";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Loader2, Search, ArrowLeft } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  name: string;
  image?: string;
}

export default function NewMessage() {
  const { sendMessage } = useMessagesContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setUsers([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error("Error searching users:", error);
        toast.error("Failed to search for users");
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!selectedUser || !messageContent.trim()) {
      return;
    }

    setIsSending(true);
    try {
      await sendMessage({
        recipientId: selectedUser.id,
        content: messageContent.trim(),
      });
      toast.success(`Message sent to ${selectedUser.name}`);
      router.push(`/messages/${selectedUser.id}`);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={() => router.push("/messages")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
        </div>
        
        {selectedUser ? (
          <div className="mt-4 flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <img src={selectedUser.image || `/avatars/placeholder.png`} alt={selectedUser.name} />
            </Avatar>
            <div>
              <p className="font-medium text-sm text-gray-900">{selectedUser.name}</p>
              <p className="text-xs text-gray-500">@{selectedUser.username}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto"
              onClick={() => setSelectedUser(null)}
            >
              Change
            </Button>
          </div>
        ) : (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input              placeholder="Search for someone..."
              className="pl-10"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 animate-spin" />
            )}
          </div>
        )}
      </div>

      {!selectedUser && (
        <ScrollArea className="flex-1 p-4">
          {users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  className={cn(
                    "w-full flex items-center p-3 rounded-md transition-colors",
                    "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  )}
                  onClick={() => setSelectedUser(user)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <img src={user.image || `/avatars/placeholder.png`} alt={user.name} />
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium text-sm text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.length > 0 && !isSearching ? (
            <div className="text-center py-8 text-gray-500">
              <p>No users found matching "{searchQuery}"</p>
            </div>
          ) : null}
        </ScrollArea>
      )}

      {selectedUser && (
        <>
          <div className="flex-1 p-4">
            <div className="text-center py-8 text-gray-500">
              <p>Start a new conversation with {selectedUser.name}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center">
              <Input
                placeholder="Type a message..."
                value={messageContent}                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageContent(e.target.value)}
                className="flex-1"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                className="ml-2"
                onClick={handleSendMessage}
                disabled={!messageContent.trim() || isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
