"use client";

import ConversationsList from "@/components/messages/ConversationsList";
import NewMessage from "@/components/messages/NewMessage";

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
