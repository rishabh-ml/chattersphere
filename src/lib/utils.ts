import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import DOMPurify from "isomorphic-dompurify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input The input to sanitize
 * @returns The sanitized input
 */
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}
