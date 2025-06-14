/**
 * Create Indexes Script
 *
 * This script creates all the necessary indexes for the MongoDB collections.
 *
 * Usage:
 * 1. Run this script with: npm run db:indexes
 */

import mongoose from "mongoose";
import dbConnect from "../lib/dbConnect";
import Post from "../models/Post";
import User from "../models/User";
import Community from "../models/Community";
import Comment from "../models/Comment";
import Membership from "../models/Membership";
import Role from "../models/Role";
import Channel from "../models/Channel";

/**
 * Main function to create all indexes
 */
async function createIndexes() {
  console.log("🔍 Creating MongoDB indexes...");

  try {
    // Connect to the database
    await dbConnect();
    console.log("📊 Connected to database");

    // Create indexes for Post collection
    console.log("\n📄 Creating indexes for Post collection...");
    await createPostIndexes();

    // Create indexes for User collection
    console.log("\n👤 Creating indexes for User collection...");
    await createUserIndexes();

    // Create indexes for Community collection
    console.log("\n🏘️ Creating indexes for Community collection...");
    await createCommunityIndexes();

    // Create indexes for Comment collection
    console.log("\n💬 Creating indexes for Comment collection...");
    await createCommentIndexes();

    // Create indexes for Membership collection
    console.log("\n🔑 Creating indexes for Membership collection...");
    await createMembershipIndexes();

    // Create indexes for Role collection
    console.log("\n👑 Creating indexes for Role collection...");
    await createRoleIndexes();

    // Create indexes for Channel collection
    console.log("\n📢 Creating indexes for Channel collection...");
    await createChannelIndexes();

    console.log("\n✅ All indexes created successfully");

    // Disconnect from the database
    await mongoose.disconnect();
    console.log("🏁 Database connection closed");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    process.exit(1);
  }
}

/**
 * Create indexes for Post collection
 */
async function createPostIndexes() {
  try {
    // Basic indexes
    await Post.collection.createIndex({ author: 1, createdAt: -1 });
    await Post.collection.createIndex({ community: 1, createdAt: -1 });
    await Post.collection.createIndex({ createdAt: -1 });

    // Additional indexes for optimized queries
    await Post.collection.createIndex({ upvoteCount: -1, createdAt: -1 });
    await Post.collection.createIndex({ downvoteCount: -1, createdAt: -1 });
    await Post.collection.createIndex({ commentCount: -1, createdAt: -1 });

    // Compound indexes for community and popularity metrics
    await Post.collection.createIndex({ community: 1, upvoteCount: -1, createdAt: -1 });
    await Post.collection.createIndex({ community: 1, commentCount: -1, createdAt: -1 });

    // Text index for search
    await Post.collection.createIndex(
      { content: "text", title: "text" },
      { name: "post_text_index" }
    );

    console.log("  ✓ Post indexes created");
  } catch (error) {
    console.error("  ❌ Error creating Post indexes:", error);
    throw error;
  }
}

/**
 * Create indexes for User collection
 */
async function createUserIndexes() {
  try {
    // Basic indexes
    await User.collection.createIndex({ clerkId: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });

    // Additional indexes for optimized queries
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ following: 1 });
    await User.collection.createIndex({ followers: 1 });
    await User.collection.createIndex({ communities: 1 });

    // Text index for search
    await User.collection.createIndex(
      { username: "text", name: "text", bio: "text" },
      { name: "user_text_index" }
    );

    console.log("  ✓ User indexes created");
  } catch (error) {
    console.error("  ❌ Error creating User indexes:", error);
    throw error;
  }
}

/**
 * Create indexes for Community collection
 */
async function createCommunityIndexes() {
  try {
    // Basic indexes
    await Community.collection.createIndex({ name: 1 }, { unique: true });
    await Community.collection.createIndex({ slug: 1 }, { unique: true });
    await Community.collection.createIndex({ creator: 1 });
    await Community.collection.createIndex({ createdAt: -1 });

    // Additional indexes for optimized queries
    await Community.collection.createIndex({ isPrivate: 1 });
    await Community.collection.createIndex({ members: 1 });
    await Community.collection.createIndex({ "channels.isDefault": 1 });

    // Text index for search
    await Community.collection.createIndex(
      { name: "text", description: "text" },
      { name: "community_text_index" }
    );

    console.log("  ✓ Community indexes created");
  } catch (error) {
    console.error("  ❌ Error creating Community indexes:", error);
    throw error;
  }
}

/**
 * Create indexes for Comment collection
 */
async function createCommentIndexes() {
  try {
    // Basic indexes
    await Comment.collection.createIndex({ post: 1, createdAt: -1 });
    await Comment.collection.createIndex({ author: 1, createdAt: -1 });
    await Comment.collection.createIndex({ parentComment: 1 });

    // Additional indexes for optimized queries
    await Comment.collection.createIndex({ post: 1, parentComment: 1, createdAt: -1 });
    await Comment.collection.createIndex({ upvoteCount: -1, createdAt: -1 });
    await Comment.collection.createIndex({ post: 1, upvoteCount: -1 });

    // Compound index for nested comments with popularity
    await Comment.collection.createIndex({ parentComment: 1, upvoteCount: -1, createdAt: -1 });

    console.log("  ✓ Comment indexes created");
  } catch (error) {
    console.error("  ❌ Error creating Comment indexes:", error);
    throw error;
  }
}

/**
 * Create indexes for Membership collection
 */
async function createMembershipIndexes() {
  try {
    // Basic indexes
    await Membership.collection.createIndex({ user: 1, community: 1 }, { unique: true });
    await Membership.collection.createIndex({ community: 1, status: 1 });

    // Additional indexes for optimized queries
    await Membership.collection.createIndex({ user: 1, status: 1 });
    await Membership.collection.createIndex({ community: 1, roles: 1, status: 1 });
    await Membership.collection.createIndex({ community: 1, lastActive: -1 });

    console.log("  ✓ Membership indexes created");
  } catch (error) {
    console.error("  ❌ Error creating Membership indexes:", error);
    throw error;
  }
}

/**
 * Create indexes for Role collection
 */
async function createRoleIndexes() {
  try {
    // Basic indexes
    await Role.collection.createIndex({ community: 1, name: 1 }, { unique: true });
    await Role.collection.createIndex({ community: 1, position: 1 });

    // Additional indexes for optimized queries
    await Role.collection.createIndex({ community: 1, isDefault: 1 });
    await Role.collection.createIndex({ community: 1, "permissions.MANAGE_COMMUNITY": 1 });
    await Role.collection.createIndex({ community: 1, "permissions.MANAGE_CHANNELS": 1 });
    await Role.collection.createIndex({ community: 1, "permissions.MANAGE_ROLES": 1 });

    console.log("  ✓ Role indexes created");
  } catch (error) {
    console.error("  ❌ Error creating Role indexes:", error);
    throw error;
  }
}

/**
 * Create indexes for Channel collection
 */
async function createChannelIndexes() {
  try {
    // Basic indexes
    await Channel.collection.createIndex({ community: 1, slug: 1 }, { unique: true });

    // Additional indexes for optimized queries
    await Channel.collection.createIndex({ community: 1, type: 1 });
    await Channel.collection.createIndex({ community: 1, isPrivate: 1 });
    await Channel.collection.createIndex({ allowedRoles: 1 });
    await Channel.collection.createIndex({ allowedUsers: 1 });

    console.log("  ✓ Channel indexes created");
  } catch (error) {
    console.error("  ❌ Error creating Channel indexes:", error);
    throw error;
  }
}

// Run the script
createIndexes().catch((error) => {
  console.error("❌ Error running create-indexes script:", error);
  process.exit(1);
});
