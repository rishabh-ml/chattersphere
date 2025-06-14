"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { captureException } from "@/lib/sentry";

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    captureException(error, { context: "community-error-boundary" });

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by community error boundary:", error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50">
      <div className="space-y-4 max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900">Community Error</h1>
        <p className="text-gray-500">
          We encountered an error while loading this community. Our team has been notified.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="p-4 bg-red-50 rounded-md text-left">
            <p className="text-red-700 font-medium">Error: {error.message}</p>
            {error.stack && (
              <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-40">{error.stack}</pre>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => reset()}
          >
            <RefreshCw size={16} />
            Try Again
          </Button>

          <Button variant="default" size="sm" className="flex items-center gap-2" asChild>
            <Link href="/communities">
              <Home size={16} />
              All Communities
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
