// src/models/Post.ts
import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IPost extends Document {
    author: Types.ObjectId;
    content: string;
    community?: Types.ObjectId | null;
    upvoteCount: number;
    downvoteCount: number;
    commentCount: number;
    mediaUrls: string[];
    createdAt: Date;
    updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
    {
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50000,
        },
        community: {
            type: Schema.Types.ObjectId,
            ref: "Community",
            default: null,
        },
        upvoteCount: {
            type: Number,
            default: 0
        },
        downvoteCount: {
            type: Number,
            default: 0
        },
        commentCount: {
            type: Number,
            default: 0
        },
        mediaUrls: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes for efficient querying
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ community: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });

// Additional indexes for optimized queries
PostSchema.index({ upvoteCount: -1, createdAt: -1 }); // For popular posts
PostSchema.index({ downvoteCount: -1, createdAt: -1 }); // For controversial posts
PostSchema.index({ commentCount: -1, createdAt: -1 }); // For most discussed posts

// Compound index for community and popularity metrics
PostSchema.index({ community: 1, upvoteCount: -1, createdAt: -1 }); // For popular posts in a community
PostSchema.index({ community: 1, commentCount: -1, createdAt: -1 }); // For most discussed posts in a community

// Virtual for vote count
PostSchema.virtual("voteCount").get(function (this: IPost) {
    return this.upvoteCount - this.downvoteCount;
});

// Virtual for comments
PostSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'post'
});

// Virtual for votes
PostSchema.virtual('votes', {
    ref: 'Vote',
    localField: '_id',
    foreignField: 'target',
    match: { targetType: 'Post' }
});

const Post: Model<IPost> = models.Post || model<IPost>("Post", PostSchema);

export default Post;
