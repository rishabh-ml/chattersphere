import mongoose, { Document, Schema } from 'mongoose';

export interface Attachment {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: mongoose.Types.ObjectId[];
}

export interface IMessage extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  channel: mongoose.Types.ObjectId;
  community: mongoose.Types.ObjectId;
  attachments: Attachment[];
  reactions: Reaction[];
  mentions: mongoose.Types.ObjectId[];
  replyTo?: mongoose.Types.ObjectId;
  isEdited: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<Attachment>(
  {
    url: { type: String, required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const ReactionSchema = new Schema<Reaction>(
  {
    emoji: { type: String, required: true },
    count: { type: Number, default: 0 },
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    channel: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
    community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    attachments: [AttachmentSchema],
    reactions: [ReactionSchema],
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    isEdited: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create indexes for efficient queries
MessageSchema.index({ channel: 1, createdAt: -1 });
MessageSchema.index({ author: 1, createdAt: -1 });
MessageSchema.index({ community: 1, createdAt: -1 });

// Virtual for reaction count
MessageSchema.virtual('reactionCount').get(function() {
  return this.reactions.reduce((total, reaction) => total + reaction.count, 0);
});

// Method to add a reaction
MessageSchema.methods.addReaction = async function(
  emoji: string,
  userId: mongoose.Types.ObjectId | string
) {
  const userIdStr = userId.toString();

  // Find the reaction or create a new one
  const reaction = this.reactions.find((r: any) => r.emoji === emoji);

  if (reaction) {
    // Check if user already reacted
    if (!reaction.users.some((id: mongoose.Types.ObjectId) => id.toString() === userIdStr)) {
      reaction.users.push(userId);
      reaction.count += 1;
    }
  } else {
    // Create new reaction
    this.reactions.push({
      emoji,
      count: 1,
      users: [userId],
    });
  }

  return this.save();
};

// Method to remove a reaction
MessageSchema.methods.removeReaction = async function(
  emoji: string,
  userId: mongoose.Types.ObjectId | string
) {
  const userIdStr = userId.toString();
  const reactionIndex = this.reactions.findIndex((r: any) => r.emoji === emoji);

  if (reactionIndex !== -1) {
    const reaction = this.reactions[reactionIndex];
    const userIndex = reaction.users.findIndex((id: mongoose.Types.ObjectId) => id.toString() === userIdStr);

    if (userIndex !== -1) {
      reaction.users.splice(userIndex, 1);
      reaction.count -= 1;

      // Remove the reaction if no users left
      if (reaction.count === 0) {
        this.reactions.splice(reactionIndex, 1);
      }

      return this.save();
    }
  }

  return this;
};

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
