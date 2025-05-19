"use client";

import { useEffect } from "react";
import ConversationsList from "@/components/messages/ConversationsList";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function MessagesPage() {
  const router = useRouter();

  return (
    <>
      <div className="w-80 h-full">
        <ConversationsList />
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-[#00AEEF]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
          <p className="text-gray-600 mb-6">
            Select a conversation or start a new one to begin messaging
          </p>
          <Button
            onClick={() => router.push("/messages/new")}
            className="bg-[#00AEEF] hover:bg-[#0099d6] text-white"
          >
            Start a New Conversation
          </Button>
        </div>
      </div>
    </>
  );
}
