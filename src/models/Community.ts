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
  // Deprecated arrays - use Membership model instead
  // These are kept for backward compatibility but should not be used in new code
  members: mongoose.Types.ObjectId[];
  moderators: mongoose.Types.ObjectId[];
  // Channels are still managed directly
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
    // Deprecated arrays - kept for backward compatibility
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    moderators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
  },
  { timestamps: true }
);

// Create indexes for efficient queries
CommunitySchema.index({ creator: 1 });
CommunitySchema.index({ slug: 1 }, { unique: true });
CommunitySchema.index({ name: 'text', description: 'text' });

// Virtual field for member count - now uses Membership model
CommunitySchema.virtual('memberCount').get(async function() {
  try {
    const Membership = mongoose.model('Membership');
    const count = await Membership.countDocuments({
      community: this._id,
      status: 'ACTIVE'
    });
    return count;
  } catch (error) {
    // Fallback to the deprecated array if Membership model fails
    return this.members.length;
  }
});

// Virtual field for post count - now uses Post model
CommunitySchema.virtual('postCount').get(async function() {
  try {
    const Post = mongoose.model('Post');
    const count = await Post.countDocuments({ community: this._id });
    return count;
  } catch (error) {
    // No fallback needed as posts array is removed
    return 0;
  }
});

// Virtual field for channel count
CommunitySchema.virtual('channelCount').get(function() {
  return this.channels.length;
});

// Virtual for posts
CommunitySchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'community'
});

// Virtual for memberships
CommunitySchema.virtual('memberships', {
  ref: 'Membership',
  localField: '_id',
  foreignField: 'community'
});

// Method to check if a user is a member - now uses Membership model
CommunitySchema.methods.isMember = async function(userId: mongoose.Types.ObjectId | string) {
  try {
    const Membership = mongoose.model('Membership');
    const membership = await Membership.findOne({
      community: this._id,
      user: userId,
      status: 'ACTIVE'
    });
    return !!membership;
  } catch (error) {    // Fallback to the deprecated array if Membership model fails
    return this.members.some((id: any) => id.toString() === userId.toString());
  }
};

// Method to check if a user is a moderator - now uses Membership and Role models
CommunitySchema.methods.isModerator = async function(userId: mongoose.Types.ObjectId | string) {
  try {
    const Membership = mongoose.model('Membership');
    const Role = mongoose.model('Role');

    // Find moderator role
    const modRole = await Role.findOne({
      community: this._id,
      name: 'Moderator'
    });

    if (!modRole) {      // Fallback to the deprecated array if Role model fails
      return this.moderators.some((id: any) => id.toString() === userId.toString());
    }

    // Check if user has the moderator role
    const membership = await Membership.findOne({
      community: this._id,
      user: userId,
      status: 'ACTIVE',
      roles: { $in: [modRole._id] }
    });

    return !!membership;
  } catch (error) {    // Fallback to the deprecated array if models fail
    return this.moderators.some((id: any) => id.toString() === userId.toString());
  }
};

// Method to check if a user is the creator/owner
CommunitySchema.methods.isCreator = function(userId: mongoose.Types.ObjectId | string) {
  return this.creator.toString() === userId.toString();
};

// Method to check if a user has admin privileges (creator or moderator)
CommunitySchema.methods.hasAdminPrivileges = function(userId: mongoose.Types.ObjectId | string) {
  return this.isCreator(userId) || this.isModerator(userId);
};

// Pre-save hook to generate a slug if one isn't provided
CommunitySchema.pre('save', async function(next) {
  // Only run this if the slug is not set or is empty
  if (!this.slug) {
    try {
      // Import the generateSlug function dynamically to avoid circular dependencies
      const { generateSlug } = await import('@/lib/utils');

      // Generate a base slug from the name
      let slug = generateSlug(this.name);

      // If the slug is empty (e.g., if name contained only special characters),
      // use a fallback
      if (!slug) {
        slug = 'untitled';
      }

      // Check if the slug already exists
      let counter = 1;
      let uniqueSlug = slug;
      let exists = await mongoose.models.Community.findOne({ slug: uniqueSlug, _id: { $ne: this._id } });

      // If the slug exists, append a number and check again
      while (exists) {
        uniqueSlug = `${slug}-${counter}`;
        exists = await mongoose.models.Community.findOne({ slug: uniqueSlug, _id: { $ne: this._id } });
        counter++;
      }

      // Set the unique slug
      this.slug = uniqueSlug;
    } catch (error) {
      return next(error as Error);
    }
  }

  next();
});

export default mongoose.models.Community || mongoose.model<ICommunity>('Community', CommunitySchema);
