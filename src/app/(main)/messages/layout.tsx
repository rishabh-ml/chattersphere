"use client";

import { DirectMessageProvider } from "@/context/DirectMessageContext";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    redirect("/sign-in");
  }

  return (
    <DirectMessageProvider>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex">{children}</div>
      </div>
    </DirectMessageProvider>
  );
}
