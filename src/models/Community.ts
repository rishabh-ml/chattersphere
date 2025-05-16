import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunity extends Document {
  name: string;
  slug: string;
  description: string;
  image?: string;
  banner?: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  creator: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  moderators: mongoose.Types.ObjectId[];
  posts: mongoose.Types.ObjectId[];
  channels: mongoose.Types.ObjectId[];
  roles: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    image: { type: String },
    banner: { type: String },
    isPrivate: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    moderators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
  },
  { timestamps: true }
);

// Create indexes for efficient queries
CommunitySchema.index({ creator: 1 });
CommunitySchema.index({ slug: 1 }, { unique: true });
CommunitySchema.index({ name: 'text', description: 'text' });

// Virtual field for member count
CommunitySchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual field for post count
CommunitySchema.virtual('postCount').get(function() {
  return this.posts.length;
});

// Virtual field for channel count
CommunitySchema.virtual('channelCount').get(function() {
  return this.channels.length;
});

// Method to check if a user is a member
CommunitySchema.methods.isMember = function(userId: mongoose.Types.ObjectId | string) {
  return this.members.some(id => id.toString() === userId.toString());
};

// Method to check if a user is a moderator
CommunitySchema.methods.isModerator = function(userId: mongoose.Types.ObjectId | string) {
  return this.moderators.some(id => id.toString() === userId.toString());
};

// Method to check if a user is the creator/owner
CommunitySchema.methods.isCreator = function(userId: mongoose.Types.ObjectId | string) {
  return this.creator.toString() === userId.toString();
};

// Method to check if a user has admin privileges (creator or moderator)
CommunitySchema.methods.hasAdminPrivileges = function(userId: mongoose.Types.ObjectId | string) {
  return this.isCreator(userId) || this.isModerator(userId);
};

export default mongoose.models.Community || mongoose.model<ICommunity>('Community', CommunitySchema);
