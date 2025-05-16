// src/models/Post.ts
import { Schema, model, models, Document, Model, Types } from "mongoose";

export interface IPost extends Document {
    author: Types.ObjectId;
    content: string;
    community?: Types.ObjectId | null;
    upvotes: Types.ObjectId[];
    downvotes: Types.ObjectId[];
    comments: Types.ObjectId[];
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
        upvotes: {
            type: [Schema.Types.ObjectId],
            ref: "User",
            default: []
        },
        downvotes: {
            type: [Schema.Types.ObjectId],
            ref: "User",
            default: []
        },
        comments: {
            type: [Schema.Types.ObjectId],
            ref: "Comment",
            default: []
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

// Virtual for vote count
PostSchema.virtual("voteCount").get(function (this: IPost) {
    return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

// Virtual for comment count
PostSchema.virtual("commentCount").get(function (this: IPost) {
    return this.comments?.length || 0;
});

const Post: Model<IPost> = models.Post || model<IPost>("Post", PostSchema);

export default Post;
