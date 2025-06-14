"use client";

import { useEffect, useState } from "react";
import ConversationsList from "@/components/messages/ConversationsList";
import ConversationView from "@/components/messages/ConversationView";
import { useDirectMessages } from "@/context/DirectMessageContext";

interface ConversationPageProps {
  params: {
    userId: string;
  };
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { userId } = params;
  const { setActiveConversation, conversations } = useDirectMessages();
  const [userName, setUserName] = useState<string | undefined>(undefined);

  // Set active conversation when the page loads
  useEffect(() => {
    if (userId) {
      setActiveConversation(userId);

      // Find user name from conversations
      const conversation = conversations.find((c) => c.userId === userId);
      if (conversation) {
        setUserName(conversation.name);
      }
    }

    return () => {
      setActiveConversation(null);
    };
  }, [userId, conversations]);

  return (
    <>
      <div className="w-80 h-full">
        <ConversationsList />
      </div>
      <div className="flex-1 h-full">
        <ConversationView userId={userId} userName={userName} />
      </div>
    </>
  );
}
