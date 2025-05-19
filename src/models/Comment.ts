import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  author: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  content: string;
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  upvoteCount: number;
  downvoteCount: number;
  parentComment?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    content: { type: String, required: true },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    upvoteCount: { type: Number, default: 0 },
    downvoteCount: { type: Number, default: 0 },
    parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' },
  },
  { timestamps: true }
);

// Create indexes for faster queries
CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ author: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1 });

// Additional indexes for optimized queries
CommentSchema.index({ post: 1, parentComment: 1, createdAt: -1 }); // For top-level comments in a post
CommentSchema.index({ upvoteCount: -1, createdAt: -1 }); // For popular comments
CommentSchema.index({ post: 1, upvoteCount: -1 }); // For best comments in a post

// Compound index for nested comments with popularity
CommentSchema.index({ parentComment: 1, upvoteCount: -1, createdAt: -1 }); // For popular replies

// Pre-save hook to update upvoteCount and downvoteCount
CommentSchema.pre('save', function(next) {
  if (this.isModified('upvotes')) {
    this.upvoteCount = this.upvotes.length;
  }
  if (this.isModified('downvotes')) {
    this.downvoteCount = this.downvotes.length;
  }
  next();
});

// Virtual field for vote count
CommentSchema.virtual('voteCount').get(function() {
  return this.upvoteCount - this.downvoteCount;
});

// Virtual for votes
CommentSchema.virtual('votes', {
  ref: 'Vote',
  localField: '_id',
  foreignField: 'target',
  match: { targetType: 'Comment' }
});

// Virtual for replies (child comments)
CommentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
