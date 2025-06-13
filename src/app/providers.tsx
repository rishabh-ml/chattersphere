"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { DirectMessageProvider } from "@/context/DirectMessageContext";
import { NavigationProvider } from "@/lib/navigation";
import DataProvider from "@/shared/providers/DataProvider";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <DataProvider>
      <NavigationProvider>
        <DirectMessageProvider>
          {children}
          <Toaster position="top-right" />
        </DirectMessageProvider>
      </NavigationProvider>
    </DataProvider>
  );
}
