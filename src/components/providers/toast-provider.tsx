"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      className="toaster-root"
      toastOptions={{
        classNames: {
          toast: "bg-white text-gray-800 border border-gray-200 shadow-md rounded-lg",
          success: "toast-success border-l-4 border-l-green-500",
          error: "toast-error border-l-4 border-l-red-500",
          warning: "toast-warning border-l-4 border-l-amber-500",
          info: "toast-info border-l-4 border-l-blue-500",
          title: "text-sm font-medium",
          description: "text-xs text-gray-500 mt-1",
          actionButton: "bg-primary text-white text-xs px-2 py-1 rounded-md",
          cancelButton: "text-gray-500 text-xs px-2 py-1 rounded-md",
          closeButton: "text-gray-400 hover:text-gray-500",
        },
      }}
    />
  );
}
