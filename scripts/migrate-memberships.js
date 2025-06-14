// scripts/migrate-memberships.js
// This script migrates community memberships from the old schema (arrays in Community) to the Membership model

require("dotenv").config();
const mongoose = require("mongoose");

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "chattersphere" });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

// Define schemas
const CommunitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    image: { type: String },
    banner: { type: String },
    isPrivate: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    channels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Channel" }],
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    communities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Community" }],
  },
  { timestamps: true }
);

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: "#99AAB5" },
    community: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
    position: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const MembershipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    status: { type: String, enum: ["PENDING", "ACTIVE", "BANNED"], default: "ACTIVE" },
    displayName: { type: String },
    joinedAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Create compound index for user and community to ensure a user can only have one membership per community
MembershipSchema.index({ user: 1, community: 1 }, { unique: true });

// Create models
const Community = mongoose.model("Community", CommunitySchema);
const User = mongoose.model("User", UserSchema);
const Role = mongoose.model("Role", RoleSchema);
const Membership = mongoose.model("Membership", MembershipSchema);

// Migrate community memberships
const migrateMemberships = async () => {
  console.log("Migrating community memberships...");
  const communities = await Community.find({});
  console.log(`Found ${communities.length} communities to process`);

  let totalMemberships = 0;

  for (const community of communities) {
    console.log(`Processing community: ${community.name} (${community._id})`);

    // Find default member role
    let memberRole = await Role.findOne({
      community: community._id,
      name: "Member",
      isDefault: true,
    });

    if (!memberRole) {
      console.log(`Creating default Member role for community ${community.name}`);
      memberRole = await Role.create({
        name: "Member",
        color: "#99AAB5",
        community: community._id,
        position: 0,
        isDefault: true,
      });
    }

    // Find moderator role
    let modRole = await Role.findOne({
      community: community._id,
      name: "Moderator",
    });

    if (!modRole) {
      console.log(`Creating Moderator role for community ${community.name}`);
      modRole = await Role.create({
        name: "Moderator",
        color: "#00FF00",
        community: community._id,
        position: 50,
        isDefault: false,
      });
    }

    // Find admin role
    let adminRole = await Role.findOne({
      community: community._id,
      name: "Admin",
    });

    if (!adminRole) {
      console.log(`Creating Admin role for community ${community.name}`);
      adminRole = await Role.create({
        name: "Admin",
        color: "#FF0000",
        community: community._id,
        position: 100,
        isDefault: false,
      });
    }

    // Create membership for creator with Admin role
    try {
      await Membership.findOneAndUpdate(
        { user: community.creator, community: community._id },
        {
          status: "ACTIVE",
          roles: [adminRole._id, modRole._id, memberRole._id],
          joinedAt: community.createdAt,
          lastActive: new Date(),
        },
        { upsert: true, new: true }
      );
      totalMemberships++;
    } catch (error) {
      console.error(
        `Error creating membership for creator ${community.creator} in community ${community._id}:`,
        error
      );
    }

    // Create memberships for moderators with Moderator role
    for (const userId of community.moderators) {
      // Skip creator as they already have a membership with Admin role
      if (userId.toString() === community.creator.toString()) {
        continue;
      }

      try {
        await Membership.findOneAndUpdate(
          { user: userId, community: community._id },
          {
            status: "ACTIVE",
            roles: [modRole._id, memberRole._id],
            joinedAt: community.createdAt,
            lastActive: new Date(),
          },
          { upsert: true, new: true }
        );
        totalMemberships++;
      } catch (error) {
        console.error(
          `Error creating membership for moderator ${userId} in community ${community._id}:`,
          error
        );
      }
    }

    // Create memberships for regular members with Member role
    for (const userId of community.members) {
      // Skip creator and moderators as they already have memberships
      if (
        userId.toString() === community.creator.toString() ||
        community.moderators.some((modId) => modId.toString() === userId.toString())
      ) {
        continue;
      }

      try {
        await Membership.findOneAndUpdate(
          { user: userId, community: community._id },
          {
            status: "ACTIVE",
            roles: [memberRole._id],
            joinedAt: community.createdAt,
            lastActive: new Date(),
          },
          { upsert: true, new: true }
        );
        totalMemberships++;
      } catch (error) {
        console.error(
          `Error creating membership for member ${userId} in community ${community._id}:`,
          error
        );
      }
    }
  }

  console.log(`Migrated ${totalMemberships} community memberships`);
};

// Main migration function
const migrate = async () => {
  await connectToDatabase();

  try {
    await migrateMemberships();

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the migration
migrate();
