"use client";

import { useEffect, useRef, useState } from "react";
import { useMessagesContext } from "../contexts/MessagesContext";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Loader2, ArrowLeft, Paperclip, Send } from "lucide-react";
import { Avatar } from "@/shared/ui/avatar";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";
import { useRouter } from "next/navigation";
import { MessageSender } from "../types";

interface ConversationViewProps {
  recipientId: string;
}

export default function ConversationView({ recipientId }: ConversationViewProps) {
  const {
    messages,
    setCurrentRecipient,
    sendMessage,
    markAsRead,
    hasMoreMessages,
    loadMoreMessages,
    isLoadingMessages,
  } = useMessagesContext();
  
  const [messageContent, setMessageContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [recipient, setRecipient] = useState<MessageSender | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Set current recipient and fetch recipient data
  useEffect(() => {
    setCurrentRecipient(recipientId);
    
    // Fetch recipient data
    const fetchRecipient = async () => {
      try {
        const response = await fetch(`/api/users/${recipientId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch recipient data");
        }
        
        const data = await response.json();
        setRecipient(data.user);
      } catch (error) {
        console.error("Error fetching recipient:", error);
        toast.error("Could not load recipient information");
      }
    };
    
    fetchRecipient();
    
    // Mark messages as read
    markAsRead(recipientId).catch(error => {
      console.error("Error marking messages as read:", error);
    });
    
    return () => {
      setCurrentRecipient(null);
    };
  }, [recipientId, setCurrentRecipient, markAsRead]);
  
  // Scroll to bottom when new messages come in
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;
    
    setIsSending(true);
    try {
      await sendMessage({
        recipientId,
        content: messageContent.trim(),
      });
      setMessageContent("");
    } catch (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle uploading attachments
  const handleAttachmentUpload = () => {
    // Placeholder for attachment handling
    toast.info("Attachment feature coming soon");
  };
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2 md:hidden"
            onClick={() => router.push("/messages")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          
          {recipient ? (
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <img src={recipient.image || `/avatars/placeholder.png`} alt={recipient.name} />
              </Avatar>
              <div>
                <p className="font-medium text-sm text-gray-900">{recipient.name}</p>
                <p className="text-xs text-gray-500">@{recipient.username}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="h-8 w-8 mr-2 bg-gray-200 rounded-full animate-pulse" />
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-16 mt-1 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {hasMoreMessages && (
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMoreMessages()}
              disabled={isLoadingMessages}
            >
              {isLoadingMessages ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                "Load older messages"
              )}
            </Button>
          </div>
        )}
        
        {messages.length === 0 && !isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm mt-1">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isSender = message.sender.id !== recipientId;
              return (
                <div
                  key={message.id}
                  className={cn("flex", isSender ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      isSender
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-900 rounded-bl-none"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        isSender ? "text-blue-100" : "text-gray-500"
                      )}
                    >
                      {format(new Date(message.createdAt), "h:mm a")}
                    </p>
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className={cn(
                              "p-2 rounded flex items-center",
                              isSender ? "bg-blue-600" : "bg-gray-200"
                            )}
                          >
                            <Paperclip className="h-4 w-4 mr-2" />
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm underline truncate"
                            >
                              {attachment.name}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Message Input */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAttachmentUpload}
            className="mr-2"
          >
            <Paperclip className="h-5 w-5 text-gray-500" />
            <span className="sr-only">Attach files</span>
          </Button>
            <Input
            placeholder="Type a message..."
            value={messageContent}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageContent(e.target.value)}
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
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
