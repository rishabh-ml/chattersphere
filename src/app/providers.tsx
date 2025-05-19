"use client";

import { ReactNode } from "react";
import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { DirectMessageProvider } from "@/context/DirectMessageContext";
import { NavigationProvider } from "@/lib/navigation";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => fetch(url).then((res) => res.json()),
        revalidateOnFocus: false,
      }}
    >
      <NavigationProvider>
        <DirectMessageProvider>
          {children}
          <Toaster position="top-right" />
        </DirectMessageProvider>
      </NavigationProvider>
    </SWRConfig>
  );
}
