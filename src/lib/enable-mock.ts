// This file enables the Supabase mock implementation by default in development
// It's imported by the app layout to ensure it runs on every page

"use client";

import { useEffect } from "react";

export default function EnableMock() {
  useEffect(() => {
    // Only run in development and in the browser
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      // Enable mock by default
      if (!localStorage.getItem("USE_SUPABASE_MOCK")) {
        console.log("Enabling Supabase mock implementation by default");
        localStorage.setItem("USE_SUPABASE_MOCK", "true");
      }

      // Check if we can connect to Supabase
      fetch(process.env.NEXT_PUBLIC_SUPABASE_URL || "", {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
        signal: AbortSignal.timeout(2000), // Timeout after 2 seconds
      })
        .then(() => {
          console.log("Supabase connection available");
          // Keep using mock unless explicitly disabled
        })
        .catch(() => {
          console.log("Supabase connection not available, forcing mock implementation");
          localStorage.setItem("USE_SUPABASE_MOCK", "true");
        });
    }
  }, []);

  // This component doesn't render anything
  return null;
}
