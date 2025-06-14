"use client";

import { useEffect, useRef, useState } from "react";
import { useDirectMessages, Message } from "@/context/DirectMessageContext";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Image as ImageIcon, Smile, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ConversationViewProps {
  userId: string;
  userName?: string;
}

export default function ConversationView({ userId, userName }: ConversationViewProps) {
  const {
    messages,
    isLoadingMessages,
    isSendingMessage,
    hasMoreMessages,
    messagesPage,
    fetchMessages,
    sendMessage,
    markMessageAsRead,
  } = useDirectMessages();

  const { user } = useUser();
  const [messageContent, setMessageContent] = useState("");
  const [userInfo, setUserInfo] = useState<{ name: string; image?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Fetch messages when the component mounts
  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
    }
  }, [userId]);

  // Fetch user info if not provided
  useEffect(() => {
    if (userId && !userName && messages.length > 0) {
      const otherUserMessage = messages.find((m) => m.sender.id !== user?.id);
      if (otherUserMessage) {
        setUserInfo({
          name: otherUserMessage.sender.name,
          image: otherUserMessage.sender.image,
        });
      }
    } else if (userName) {
      setUserInfo({ name: userName });
    }
  }, [userId, userName, messages, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isLoadingMessages) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoadingMessages]);

  // Handle scroll to detect when to show scroll button
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    scrollArea.addEventListener("scroll", handleScroll);
    return () => scrollArea.removeEventListener("scroll", handleScroll);
  }, []);

  // Mark unread messages as read
  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach((message) => {
        if (!message.isRead && message.sender.id !== user?.id) {
          markMessageAsRead(message.id);
        }
      });
    }
  }, [messages, user?.id]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageContent.trim() || isSendingMessage) return;

    try {
      await sendMessage(userId, messageContent);
      setMessageContent("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle loading more messages
  const handleLoadMore = () => {
    if (hasMoreMessages && !isLoadingMessages) {
      fetchMessages(userId, messagesPage + 1);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  messages.forEach((message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center">
        <Avatar className="h-10 w-10 mr-3">
          <img
            src={
              userInfo?.image ||
              `https://placehold.co/200x200?text=${userInfo?.name?.charAt(0) || "?"}`
            }
            alt={userInfo?.name || "User"}
          />
        </Avatar>
        <div>
          <h2 className="font-semibold">{userInfo?.name || "Loading..."}</h2>
          {userId && (
            <Link href={`/profile/${userId}`} className="text-xs text-[#00AEEF] hover:underline">
              View Profile
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {isLoadingMessages && messagesPage === 1 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-[#00AEEF]" />
          </div>
        ) : (
          <>
            {hasMoreMessages && (
              <div className="text-center mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoadingMessages}
                >
                  {isLoadingMessages ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load older messages"
                  )}
                </Button>
              </div>
            )}

            {Object.keys(groupedMessages).map((date) => (
              <div key={date}>
                <div className="text-center my-4">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    {date === new Date().toLocaleDateString() ? "Today" : date}
                  </span>
                </div>

                {groupedMessages[date].map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "mb-4 max-w-[80%]",
                      message.sender.id === user?.id ? "ml-auto" : "mr-auto"
                    )}
                  >
                    <div className="flex items-start">
                      {message.sender.id !== user?.id && (
                        <Avatar className="h-8 w-8 mr-2 mt-1">
                          <img
                            src={
                              message.sender.image ||
                              `https://placehold.co/200x200?text=${message.sender.name.charAt(0)}`
                            }
                            alt={message.sender.name}
                          />
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "rounded-lg p-3",
                          message.sender.id === user?.id
                            ? "bg-[#00AEEF] text-white"
                            : "bg-gray-100 text-gray-800"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>

                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <div key={index}>
                                {attachment.type.startsWith("image/") ? (
                                  <img
                                    src={attachment.url}
                                    alt={attachment.name}
                                    className="max-w-full rounded"
                                  />
                                ) : (
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center p-2 bg-white bg-opacity-10 rounded"
                                  >
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    <span className="text-sm truncate">{attachment.name}</span>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={cn(
                        "text-xs text-gray-500 mt-1",
                        message.sender.id === user?.id ? "text-right" : "text-left"
                      )}
                    >
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                      })}
                      {message.sender.id === user?.id && (
                        <span className="ml-2">{message.isRead ? "Read" : "Sent"}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </>
        )}
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          className="absolute bottom-20 right-4 rounded-full h-10 w-10 p-0 bg-[#00AEEF] hover:bg-[#0099d6] text-white shadow-md"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}

      {/* Message input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              placeholder="Type a message..."
              className="min-h-[80px] pr-10 resize-none"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="absolute right-3 bottom-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-gray-700"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Button
            className="bg-[#00AEEF] hover:bg-[#0099d6] text-white h-10 w-10 rounded-full p-0"
            onClick={handleSendMessage}
            disabled={!messageContent.trim() || isSendingMessage}
          >
            {isSendingMessage ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
