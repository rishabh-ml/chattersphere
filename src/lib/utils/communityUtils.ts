// src/lib/utils/communityUtils.ts
import { Types } from "mongoose";
import { PopulatedCreator } from "@/types/CommunityType";

/**
 * Maps a creator object from MongoDB to a consistent format for API responses
 * Handles both populated and unpopulated creator references
 */
export function mapCreator(
  creator: Types.ObjectId | PopulatedCreator
): { id: string; username: string; name: string; image?: string } {
  if (typeof creator === "object" && "username" in creator && creator.username) {
    return {
      id: creator._id.toString(),
      username: creator.username,
      name: creator.name || "",
      image: creator.image,
    };
  } else {
    // Handle unpopulated creator or missing data
    return {
      id: (typeof creator === "object" ? creator._id : creator).toString(),
      username: "",
      name: ""
    };
  }
}

/**
 * Safely checks if a user is a member of a community
 * Handles potential null/undefined arrays
 */
export function isMemberOf(
  userId: Types.ObjectId | null,
  members: Types.ObjectId[] | undefined | null
): boolean {
  if (!userId || !members || !Array.isArray(members)) {
    return false;
  }
  return members.some(m => m.equals(userId));
}

/**
 * Safely gets the length of an array, handling null/undefined
 */
export function safeArrayLength<T>(arr: T[] | undefined | null): number {
  if (!arr || !Array.isArray(arr)) {
    return 0;
  }
  return arr.length;
}

/**
 * Checks if a string is a valid MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && String(new Types.ObjectId(id)) === id;
}

/**
 * Checks if a user is the creator of a community
 * Handles both populated and unpopulated creator references
 */
export function isCreatorOf(
  userId: Types.ObjectId | null,
  creator: Types.ObjectId | PopulatedCreator
): boolean {
  if (!userId) return false;

  return typeof creator === "object" && "_id" in creator
    ? creator._id.equals(userId)
    : (creator as Types.ObjectId).equals(userId);
}
