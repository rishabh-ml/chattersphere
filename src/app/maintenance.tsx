"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function MaintenancePage() {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    // Auto-refresh countdown
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      window.location.reload();
    }
  }, [countdown]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-gray-50">
      <div className="space-y-6 max-w-md">
        <div className="w-24 h-24 mx-auto">
          <svg
            className="w-full h-full text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-gray-900">We'll be right back!</h1>
        <p className="text-gray-600">
          ChatterSphere is currently undergoing scheduled maintenance. We apologize for the
          inconvenience and should be back online shortly.
        </p>

        <div className="p-4 bg-blue-50 rounded-md">
          <p className="text-blue-700">
            The site will automatically refresh in <span className="font-bold">{countdown}</span>{" "}
            seconds.
          </p>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="flex items-center gap-2 mx-auto"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={16} />
          Refresh Now
        </Button>
      </div>
    </div>
  );
}
