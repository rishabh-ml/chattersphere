import mongoose, { Document, Schema } from "mongoose";

export enum MembershipStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  BANNED = "BANNED",
}

export interface IMembership extends Document {
  user: mongoose.Types.ObjectId;
  community: mongoose.Types.ObjectId;
  roles: mongoose.Types.ObjectId[];
  status: MembershipStatus;
  displayName?: string;
  joinedAt: Date;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    community: { type: Schema.Types.ObjectId, ref: "Community", required: true },
    roles: [{ type: Schema.Types.ObjectId, ref: "Role" }],
    status: {
      type: String,
      enum: Object.values(MembershipStatus),
      default: MembershipStatus.ACTIVE,
    },
    displayName: { type: String },
    joinedAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Create compound index for user and community
MembershipSchema.index({ user: 1, community: 1 }, { unique: true });

// Create index for community to find all members
MembershipSchema.index({ community: 1, status: 1 });

// Create index for user to find all memberships
MembershipSchema.index({ user: 1, status: 1 });

// Create index for roles to find members with specific roles
MembershipSchema.index({ community: 1, roles: 1, status: 1 });

// Create index for lastActive to find recently active members
MembershipSchema.index({ community: 1, lastActive: -1 });

// Method to check if user has a specific role
MembershipSchema.methods.hasRole = function (roleId: mongoose.Types.ObjectId | string) {
  return this.roles.some((id: mongoose.Types.ObjectId) => id.toString() === roleId.toString());
};

// Method to add a role
MembershipSchema.methods.addRole = async function (roleId: mongoose.Types.ObjectId | string) {
  const roleIdStr = roleId.toString();

  // Check if role already exists
  if (!this.roles.some((id: mongoose.Types.ObjectId) => id.toString() === roleIdStr)) {
    this.roles.push(roleId);
    return this.save();
  }

  return this;
};

// Method to remove a role
MembershipSchema.methods.removeRole = async function (roleId: mongoose.Types.ObjectId | string) {
  const roleIdStr = roleId.toString();
  const roleIndex = this.roles.findIndex(
    (id: mongoose.Types.ObjectId) => id.toString() === roleIdStr
  );

  if (roleIndex !== -1) {
    this.roles.splice(roleIndex, 1);
    return this.save();
  }

  return this;
};

// Static method to get a user's roles in a community
MembershipSchema.statics.getUserRoles = async function (
  userId: mongoose.Types.ObjectId | string,
  communityId: mongoose.Types.ObjectId | string
) {
  const membership = await this.findOne({
    user: userId,
    community: communityId,
    status: MembershipStatus.ACTIVE,
  }).populate("roles");

  return membership ? membership.roles : [];
};

export default mongoose.models.Membership ||
  mongoose.model<IMembership>("Membership", MembershipSchema);
