"use client";

import { useState, useEffect } from "react";
import { useDirectMessages } from "@/context/DirectMessageContext";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  name: string;
  image?: string;
}

export default function NewMessage() {
  const { sendMessage } = useDirectMessages();
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
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setUsers([]);
        return;
      }

      setIsSearching(true);

      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);

        if (!response.ok) {
          throw new Error("Failed to search users");
        }

        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error("Error searching users:", error);
        toast.error("Failed to search users");
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimeout = setTimeout(searchUsers, 500);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSearchQuery("");
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!selectedUser || !messageContent.trim() || isSending) return;

    setIsSending(true);

    try {
      await sendMessage(selectedUser.id, messageContent);
      toast.success(`Message sent to ${selectedUser.name}`);
      router.push(`/messages/${selectedUser.id}`);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (selectedUser) {
      setSelectedUser(null);
    } else {
      router.push("/messages");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold">
          {selectedUser ? `New Message to ${selectedUser.name}` : "New Message"}
        </h2>
      </div>

      {selectedUser ? (
        // Message composition view
        <div className="flex flex-col flex-1">
          <div className="p-4 border-b border-gray-200 flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <img
                src={selectedUser.image || `https://placehold.co/200x200?text=${selectedUser.name.charAt(0)}`}
                alt={selectedUser.name}
              />
            </Avatar>
            <div>
              <h3 className="font-medium">{selectedUser.name}</h3>
              <p className="text-xs text-gray-500">@{selectedUser.username}</p>
            </div>
          </div>

          <div className="flex-1 p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AEEF] focus:border-transparent min-h-[150px]"
                placeholder="Type your message here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-[#00AEEF] hover:bg-[#0099d6] text-white"
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </div>
        </div>
      ) : (
        // User search view
        <div className="flex flex-col flex-1">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for a user..."
                className="pl-9 bg-gray-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {isSearching ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-[#00AEEF]" />
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="p-4 text-center text-gray-500">
                Enter at least 2 characters to search
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No users found
              </div>
            ) : (
              <div className="p-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleUserSelect(user)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <img
                        src={user.image || `https://placehold.co/200x200?text=${user.name.charAt(0)}`}
                        alt={user.name}
                      />
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
