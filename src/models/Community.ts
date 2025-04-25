import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunity extends Document {
  name: string;
  description: string;
  image?: string;
  creator: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  moderators: mongoose.Types.ObjectId[];
  posts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    image: { type: String },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    moderators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  },
  { timestamps: true }
);

// Create index for creator (name index is already defined with unique: true)
CommunitySchema.index({ creator: 1 });

// Virtual field for member count
CommunitySchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual field for post count
CommunitySchema.virtual('postCount').get(function() {
  return this.posts.length;
});

export default mongoose.models.Community || mongoose.model<ICommunity>('Community', CommunitySchema);
