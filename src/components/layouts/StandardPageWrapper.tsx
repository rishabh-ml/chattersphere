"use client";

import React from "react";

interface StandardPageWrapperProps {
  children: React.ReactNode;
}

/**
 * A wrapper component for standard pages that need the max-width container
 * This helps maintain consistent layout for regular pages while allowing
 * nested layouts to use the full width
 */
export function StandardPageWrapper({ children }: StandardPageWrapperProps) {
  return <div className="max-w-3xl mx-auto">{children}</div>;
}
