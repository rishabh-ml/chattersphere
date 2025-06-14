"use client";

import ConversationsList from "@/features/messages/components/ConversationsList";
import NewMessage from "@/features/messages/components/NewMessage";

export default function NewMessagePage() {
  return (
    <>
      <div className="w-80 h-full">
        <ConversationsList />
      </div>
      <div className="flex-1 h-full">
        <NewMessage />
      </div>
    </>
  );
}
