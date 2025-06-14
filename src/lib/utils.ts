import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DOMPurify from "isomorphic-dompurify";
import mongoose from "mongoose";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input The input to sanitize
 * @returns The sanitized input
 */
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}

/**
 * Generates a URL-friendly slug from a string
 * @param name The string to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
}

/**
 * Generates a unique slug for a community or other entity
 * @param name The name to base the slug on
 * @param model The mongoose model to check for existing slugs
 * @param existingId Optional ID to exclude from uniqueness check (for updates)
 * @returns A promise that resolves to a unique slug
 */
export async function generateUniqueSlug(
  name: string,
  model: mongoose.Model<any>,
  existingId?: string
): Promise<string> {
  // Generate the base slug
  let slug = generateSlug(name);

  // If the slug is empty (e.g., if name contained only special characters),
  // use a fallback
  if (!slug) {
    slug = "untitled";
  }

  // Check if the slug already exists
  let exists = await model.findOne({
    slug,
    ...(existingId ? { _id: { $ne: existingId } } : {}),
  });

  // If the slug exists, append a number and check again
  let counter = 1;
  let uniqueSlug = slug;

  while (exists) {
    uniqueSlug = `${slug}-${counter}`;
    exists = await model.findOne({
      slug: uniqueSlug,
      ...(existingId ? { _id: { $ne: existingId } } : {}),
    });
    counter++;
  }

  return uniqueSlug;
}
