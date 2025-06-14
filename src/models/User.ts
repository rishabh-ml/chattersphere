import mongoose, { Document, Schema } from "mongoose";

export interface SocialLink {
  platform: string;
  url: string;
}

export interface PrivacySettings {
  showEmail: boolean;
  showActivity: boolean;
  allowFollowers: boolean;
  allowMessages: boolean;
}

export interface IUser extends Document {
  clerkId: string;
  username: string;
  name: string;
  email: string;
  bio?: string;
  image?: string;
  pronouns?: string;
  location?: string;
  website?: string;
  socialLinks?: SocialLink[];
  interests?: string[];
  following: mongoose.Types.ObjectId[];
  followers: mongoose.Types.ObjectId[];
  communities: mongoose.Types.ObjectId[];
  savedPosts: mongoose.Types.ObjectId[];
  privacySettings: PrivacySettings;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SocialLinkSchema = new Schema<SocialLink>(
  {
    platform: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const PrivacySettingsSchema = new Schema<PrivacySettings>(
  {
    showEmail: { type: Boolean, default: false },
    showActivity: { type: Boolean, default: true },
    allowFollowers: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bio: { type: String },
    image: { type: String },
    pronouns: { type: String },
    location: { type: String },
    website: { type: String },
    socialLinks: [SocialLinkSchema],
    interests: [{ type: String }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    communities: [{ type: Schema.Types.ObjectId, ref: "Community" }],
    savedPosts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    privacySettings: { type: PrivacySettingsSchema, default: () => ({}) },
    lastSeen: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for follower count
UserSchema.virtual("followerCount").get(function () {
  return this.followers?.length || 0;
});

// Virtual for following count
UserSchema.virtual("followingCount").get(function () {
  return this.following?.length || 0;
});

// Virtual for community count
UserSchema.virtual("communityCount").get(function () {
  return this.communities?.length || 0;
});

// Indexes are already defined with unique: true in the schema

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
