// src/types/CommunityType.ts
import { Types } from "mongoose";

/**
 * Interface for a Community document from MongoDB
 * Used for type safety when working with lean() queries
 */
export interface CommunityType {
  _id: Types.ObjectId;
  name: string;
  description: string;
  image?: string;
  creator: Types.ObjectId | PopulatedCreator;
  members: Types.ObjectId[];
  moderators: Types.ObjectId[];
  posts: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for the populated creator field
 */
export interface PopulatedCreator {
  _id: Types.ObjectId;
  username: string;
  name: string;
  image?: string;
}
