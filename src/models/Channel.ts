import mongoose, { Document, Schema } from 'mongoose';

export enum ChannelType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export interface IChannel extends Document {
  name: string;
  slug: string;
  description?: string;
  type: ChannelType;
  community: mongoose.Types.ObjectId;
  isPrivate: boolean;
  allowedRoles: mongoose.Types.ObjectId[];
  allowedUsers: mongoose.Types.ObjectId[];
  messages: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema = new Schema<IChannel>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    description: { type: String },
    type: {
      type: String,
      enum: Object.values(ChannelType),
      default: ChannelType.TEXT
    },
    community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    isPrivate: { type: Boolean, default: false },
    allowedRoles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    allowedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
  },
  { timestamps: true }
);

// Create compound index for community and slug
ChannelSchema.index({ community: 1, slug: 1 }, { unique: true });

// Create index for channel type
ChannelSchema.index({ community: 1, type: 1 });

// Create index for private channels
ChannelSchema.index({ community: 1, isPrivate: 1 });

// Create index for allowed roles and users
ChannelSchema.index({ allowedRoles: 1 });
ChannelSchema.index({ allowedUsers: 1 });

// Virtual for message count
ChannelSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to check if a user has access to this channel
ChannelSchema.methods.hasAccess = async function(
  userId: mongoose.Types.ObjectId | string,
  userRoles: mongoose.Types.ObjectId[] | string[]
) {
  // If channel is not private, everyone has access
  if (!this.isPrivate) return true;
  // Check if user is directly allowed
  if (this.allowedUsers.some((id: any) => id.toString() === userId.toString())) {
    return true;
  }

  // Check if user has an allowed role
  for (const roleId of userRoles) {
    if (this.allowedRoles.some((id: any) => id.toString() === roleId.toString())) {
      return true;
    }
  }

  return false;
};

export default mongoose.models.Channel || mongoose.model<IChannel>('Channel', ChannelSchema);
