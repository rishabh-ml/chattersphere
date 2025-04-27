// src/types/community.ts
import { Types } from "mongoose";

/**
 * Interface for a Community document from MongoDB
 * Used for type safety when working with lean() queries
 */
export interface CommunityDocument {
  _id: Types.ObjectId;
  name: string;
  description: string;
  image?: string;
  creator: Types.ObjectId | {
    _id: Types.ObjectId;
    username: string;
    name: string;
    image?: string;
  };
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

/**
 * Interface for the API response format
 */
export interface CommunityResponse {
  id: string;
  name: string;
  description: string;
  image?: string;
  creator: {
    id: string;
    username: string;
    name: string;
    image?: string;
  };
  memberCount: number;
  postCount: number;
  isMember: boolean;
  isModerator: boolean;
  isCreator: boolean;
  createdAt: string;
  updatedAt: string;
}
