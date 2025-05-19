import mongoose, { Document, Schema } from 'mongoose';

export enum VoteType {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE',
}

export interface IVote extends Document {
  user: mongoose.Types.ObjectId;
  targetType: 'Post' | 'Comment';
  target: mongoose.Types.ObjectId;
  voteType: VoteType;
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { 
      type: String, 
      enum: ['Post', 'Comment'],
      required: true 
    },
    target: { type: Schema.Types.ObjectId, refPath: 'targetType', required: true },
    voteType: { 
      type: String, 
      enum: Object.values(VoteType),
      required: true 
    },
  },
  { timestamps: true }
);

// Create compound index for user and target to ensure a user can only have one vote per target
VoteSchema.index({ user: 1, target: 1 }, { unique: true });

// Create index for target to find all votes for a specific post or comment
VoteSchema.index({ target: 1, voteType: 1 });

export default mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema);
