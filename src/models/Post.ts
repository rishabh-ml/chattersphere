import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  community?: mongoose.Types.ObjectId;
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    community: { type: Schema.Types.ObjectId, ref: 'Community' },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  },
  { timestamps: true }
);

// Create indexes for faster queries
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ community: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });

// Virtual field for vote count
PostSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual field for comment count
PostSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
