/**
 * Seed Data Script
 *
 * This script creates sample data for development and testing purposes.
 * It creates users, communities, posts, comments, and memberships.
 *
 * Usage:
 * 1. Run this script with: npm run db:seed
 */

import mongoose from "mongoose";
import dbConnect from "../lib/dbConnect";
import User from "../models/User";
import Community from "../models/Community";
import Post from "../models/Post";
import Comment from "../models/Comment";
import Membership, { MembershipStatus } from "../models/Membership";
import Role from "../models/Role";
import Channel from "../models/Channel";
import { generateSlug } from "../lib/utils";

/**
 * Main function to seed all data
 */
async function seedData() {
  console.log("🌱 Seeding database with sample data...");

  try {
    await dbConnect();

    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("⚠️ Database already contains data. Skipping seed operation.");
      console.log("   To reseed, please clear the database first.");
      process.exit(0);
    }

    // Create users
    const users = await createUsers();
    console.log(`  ✓ Created ${users.length} users`);

    // Create communities
    const communities = await createCommunities(users);
    console.log(`  ✓ Created ${communities.length} communities`);

    // Create roles for communities
    const roles = await createRoles(communities);
    console.log(`  ✓ Created ${roles.length} roles`);

    // Create channels for communities
    const channels = await createChannels(communities);
    console.log(`  ✓ Created ${channels.length} channels`);

    // Create memberships
    const memberships = await createMemberships(users, communities, roles);
    console.log(`  ✓ Created ${memberships.length} memberships`);

    // Create posts
    const posts = await createPosts(users, communities);
    console.log(`  ✓ Created ${posts.length} posts`);

    // Create comments
    const comments = await createComments(users, posts);
    console.log(`  ✓ Created ${comments.length} comments`);

    console.log("🎉 Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

/**
 * Create sample users
 */
async function createUsers() {
  const users = [
    {
      clerkId: "user_sample_admin",
      username: "admin",
      name: "Admin User",
      email: "admin@example.com",
      bio: "Platform administrator with full access to all features.",
      image: "https://placehold.co/400x400?text=Admin",
      privacySettings: {
        showEmail: false,
        showActivity: true,
        allowFollowers: true,
        allowMessages: true,
      },
    },
    {
      clerkId: "user_sample_moderator",
      username: "moderator",
      name: "Moderator User",
      email: "moderator@example.com",
      bio: "Community moderator helping to keep discussions civil and productive.",
      image: "https://placehold.co/400x400?text=Mod",
      privacySettings: {
        showEmail: false,
        showActivity: true,
        allowFollowers: true,
        allowMessages: true,
      },
    },
    {
      clerkId: "user_sample_alice",
      username: "alice",
      name: "Alice Johnson",
      email: "alice@example.com",
      bio: "Software developer interested in AI and machine learning.",
      image: "https://placehold.co/400x400?text=Alice",
      privacySettings: {
        showEmail: false,
        showActivity: true,
        allowFollowers: true,
        allowMessages: true,
      },
    },
    {
      clerkId: "user_sample_bob",
      username: "bob",
      name: "Bob Smith",
      email: "bob@example.com",
      bio: "UX designer passionate about creating intuitive user experiences.",
      image: "https://placehold.co/400x400?text=Bob",
      privacySettings: {
        showEmail: false,
        showActivity: false,
        allowFollowers: false,
        allowMessages: false,
      },
    },
    {
      clerkId: "user_sample_charlie",
      username: "charlie",
      name: "Charlie Garcia",
      email: "charlie@example.com",
      bio: "Product manager with 5+ years of experience in tech startups.",
      image: "https://placehold.co/400x400?text=Charlie",
      privacySettings: {
        showEmail: true,
        showActivity: true,
        allowFollowers: true,
        allowMessages: true,
      },
    },
  ];

  // Create users and establish following relationships
  const createdUsers = await User.create(users);

  // Set up following relationships
  const [admin, moderator, alice, bob, charlie] = createdUsers;

  // Alice follows Bob and Charlie
  alice.following.push(bob._id, charlie._id);
  bob.followers.push(alice._id);
  charlie.followers.push(alice._id);

  // Bob follows Charlie
  bob.following.push(charlie._id);
  charlie.followers.push(bob._id);

  // Charlie follows Alice
  charlie.following.push(alice._id);
  alice.followers.push(charlie._id);

  // Save the updated users
  await Promise.all([alice.save(), bob.save(), charlie.save()]);

  return createdUsers;
}

/**
 * Create sample communities
 */
async function createCommunities(users: any[]) {
  const [admin, moderator, alice, bob, charlie] = users;

  const communities = [
    {
      name: "Tech Enthusiasts",
      slug: generateSlug("Tech Enthusiasts"),
      description: "A community for discussing the latest in technology, gadgets, and software.",
      isPrivate: false,
      requiresApproval: false,
      creator: admin._id,
      members: [admin._id, moderator._id, alice._id, bob._id, charlie._id],
      moderators: [admin._id, moderator._id],
    },
    {
      name: "Design Corner",
      slug: generateSlug("Design Corner"),
      description: "Share your design work, get feedback, and discuss design trends.",
      isPrivate: false,
      requiresApproval: true,
      creator: bob._id,
      members: [bob._id, alice._id, charlie._id],
      moderators: [bob._id],
    },
    {
      name: "Private Discussion",
      slug: generateSlug("Private Discussion"),
      description: "A private community for invited members only.",
      isPrivate: true,
      requiresApproval: true,
      creator: alice._id,
      members: [alice._id, bob._id],
      moderators: [alice._id],
    },
  ];

  return await Community.create(communities);
}

/**
 * Create roles for communities
 */
async function createRoles(communities: any[]) {
  const roles = [];

  for (const community of communities) {
    // Create Admin role
    roles.push({
      name: "Admin",
      color: "#FF5733",
      community: community._id,
      position: 0,
      permissions: {
        MANAGE_COMMUNITY: true,
        MANAGE_CHANNELS: true,
        MANAGE_ROLES: true,
        MANAGE_MEMBERS: true,
        KICK_MEMBERS: true,
        BAN_MEMBERS: true,
        CREATE_INVITES: true,
        CHANGE_NICKNAME: true,
        MANAGE_NICKNAMES: true,
        READ_MESSAGES: true,
        SEND_MESSAGES: true,
        MANAGE_MESSAGES: true,
        EMBED_LINKS: true,
        ATTACH_FILES: true,
        READ_MESSAGE_HISTORY: true,
        MENTION_EVERYONE: true,
        USE_EXTERNAL_EMOJIS: true,
        ADD_REACTIONS: true,
        CONNECT: true,
        SPEAK: true,
        STREAM: true,
        MUTE_MEMBERS: true,
        DEAFEN_MEMBERS: true,
        MOVE_MEMBERS: true,
      },
      isDefault: false,
    });

    // Create Moderator role
    roles.push({
      name: "Moderator",
      color: "#33A1FF",
      community: community._id,
      position: 1,
      permissions: {
        MANAGE_COMMUNITY: false,
        MANAGE_CHANNELS: false,
        MANAGE_ROLES: false,
        MANAGE_MEMBERS: true,
        KICK_MEMBERS: true,
        BAN_MEMBERS: true,
        CREATE_INVITES: true,
        CHANGE_NICKNAME: true,
        MANAGE_NICKNAMES: true,
        READ_MESSAGES: true,
        SEND_MESSAGES: true,
        MANAGE_MESSAGES: true,
        EMBED_LINKS: true,
        ATTACH_FILES: true,
        READ_MESSAGE_HISTORY: true,
        MENTION_EVERYONE: true,
        USE_EXTERNAL_EMOJIS: true,
        ADD_REACTIONS: true,
        CONNECT: true,
        SPEAK: true,
        STREAM: true,
        MUTE_MEMBERS: true,
        DEAFEN_MEMBERS: true,
        MOVE_MEMBERS: true,
      },
      isDefault: false,
    });

    // Create Member role
    roles.push({
      name: "Member",
      color: "#33FF57",
      community: community._id,
      position: 2,
      permissions: {
        MANAGE_COMMUNITY: false,
        MANAGE_CHANNELS: false,
        MANAGE_ROLES: false,
        MANAGE_MEMBERS: false,
        KICK_MEMBERS: false,
        BAN_MEMBERS: false,
        CREATE_INVITES: false,
        CHANGE_NICKNAME: true,
        MANAGE_NICKNAMES: false,
        READ_MESSAGES: true,
        SEND_MESSAGES: true,
        MANAGE_MESSAGES: false,
        EMBED_LINKS: true,
        ATTACH_FILES: true,
        READ_MESSAGE_HISTORY: true,
        MENTION_EVERYONE: false,
        USE_EXTERNAL_EMOJIS: true,
        ADD_REACTIONS: true,
        CONNECT: true,
        SPEAK: true,
        STREAM: true,
        MUTE_MEMBERS: false,
        DEAFEN_MEMBERS: false,
        MOVE_MEMBERS: false,
      },
      isDefault: true,
    });
  }

  return await Role.create(roles);
}

/**
 * Create channels for communities
 */
async function createChannels(communities: any[]) {
  const channels = [];

  for (const community of communities) {
    // Create General channel
    channels.push({
      name: "general",
      slug: "general",
      description: "General discussion channel",
      type: "TEXT",
      isPrivate: false,
      community: community._id,
      isDefault: true,
    });

    // Create Announcements channel
    channels.push({
      name: "announcements",
      slug: "announcements",
      description: "Important announcements for the community",
      type: "TEXT",
      isPrivate: false,
      community: community._id,
      isDefault: false,
    });

    // Create Voice channel
    channels.push({
      name: "voice-chat",
      slug: "voice-chat",
      description: "Voice chat channel",
      type: "VOICE",
      isPrivate: false,
      community: community._id,
      isDefault: false,
    });
  }

  return await Channel.create(channels);
}

/**
 * Create memberships for users in communities
 */
async function createMemberships(users: any[], communities: any[], roles: any[]) {
  const [admin, moderator, alice, bob, charlie] = users;
  const [techCommunity, designCommunity, privateCommunity] = communities;
  // Get roles for each community
  const techRoles = roles.filter(
    (role: any) => role.community.toString() === techCommunity._id.toString()
  );
  const designRoles = roles.filter(
    (role: any) => role.community.toString() === designCommunity._id.toString()
  );
  const privateRoles = roles.filter(
    (role: any) => role.community.toString() === privateCommunity._id.toString()
  );
  const memberships = [
    // Tech Enthusiasts memberships
    {
      user: admin._id,
      community: techCommunity._id,
      roles: [techRoles.find((role: any) => role.name === "Admin")?._id],
      status: MembershipStatus.ACTIVE,
      displayName: "Admin",
      joinedAt: new Date(),
      lastActive: new Date(),
    },
    {
      user: moderator._id,
      community: techCommunity._id,
      roles: [techRoles.find((role: any) => role.name === "Moderator")?._id],
      status: MembershipStatus.ACTIVE,
      displayName: "Moderator",
      joinedAt: new Date(),
      lastActive: new Date(),
    },
    {
      user: alice._id,
      community: techCommunity._id,
      roles: [techRoles.find((role: any) => role.name === "Member")?._id],
      status: MembershipStatus.ACTIVE,
      displayName: "Alice",
      joinedAt: new Date(),
      lastActive: new Date(),
    },
    {
      user: bob._id,
      community: techCommunity._id,
      roles: [techRoles.find((role: any) => role.name === "Member")?._id],
      status: MembershipStatus.ACTIVE,
      displayName: "Bob",
      joinedAt: new Date(),
      lastActive: new Date(),
    },
    {
      user: charlie._id,
      community: techCommunity._id,
      roles: [techRoles.find((role: any) => role.name === "Member")?._id],
      status: MembershipStatus.ACTIVE,
      displayName: "Charlie",
      joinedAt: new Date(),
      lastActive: new Date(),
    },
    // Design Corner memberships
    {
      user: bob._id,
      community: designCommunity._id,
      roles: [designRoles.find((role: any) => role.name === "Admin")?._id],
      status: MembershipStatus.ACTIVE,
      displayName: "Bob (Admin)",
      joinedAt: new Date(),
      lastActive: new Date(),
    },
    {
      user: alice._id,
      community: designCommunity._id,
      roles: [designRoles.find((role: any) => role.name === "Member")?._id],
      status: MembershipStatus.ACTIVE,
      displayName: "Alice",
      joinedAt: new Date(),
      lastActive: new Date(),
    },
    {
      user: charlie._id,
      community: designCommunity._id,
      roles: [designRoles.find((role: any) => role.name === "Member")?._id],
      status: MembershipStatus.ACTIVE,
      displayName: "Charlie",
      joinedAt: new Date(),
      lastActive: new Date(),
    },
    {
      user: admin._id,
      community: designCommunity._id,
      roles: [designRoles.find((role: any) => role.name === "Member")?._id],
      status: MembershipStatus.PENDING,
      displayName: "Admin",
      joinedAt: new Date(),
      lastActive: new Date(),
    },
    // Private Discussion memberships
    {
      user: alice._id,
      community: privateCommunity._id,
      roles: [privateRoles.find((role: any) => role.name === "Admin")?._id],
      status: MembershipStatus.ACTIVE,
      displayName: "Alice (Admin)",
      joinedAt: new Date(),
      lastActive: new Date(),
    },
    {
      user: bob._id,
      community: privateCommunity._id,
      roles: [privateRoles.find((role: any) => role.name === "Member")?._id],
      status: MembershipStatus.ACTIVE,
      displayName: "Bob",
      joinedAt: new Date(),
      lastActive: new Date(),
    },
    {
      user: charlie._id,
      community: privateCommunity._id,
      roles: [privateRoles.find((role: any) => role.name === "Member")?._id],
      status: MembershipStatus.PENDING,
      displayName: "Charlie",
      joinedAt: new Date(),
      lastActive: new Date(),
    },
  ];

  return await Membership.create(memberships);
}

/**
 * Create sample posts
 */
async function createPosts(users: any[], communities: any[]) {
  const [admin, moderator, alice, bob, charlie] = users;
  const [techCommunity, designCommunity, privateCommunity] = communities;

  const posts = [
    // Tech Enthusiasts posts
    {
      author: admin._id,
      content:
        "Welcome to the Tech Enthusiasts community! This is a place to discuss all things tech-related.",
      community: techCommunity._id,
      upvoteCount: 15,
      downvoteCount: 2,
      commentCount: 3,
    },
    {
      author: alice._id,
      content:
        "What do you think about the latest advancements in AI? I'm particularly interested in large language models.",
      community: techCommunity._id,
      upvoteCount: 8,
      downvoteCount: 1,
      commentCount: 2,
    },
    {
      author: bob._id,
      content: "Just got a new mechanical keyboard. The typing experience is amazing!",
      community: techCommunity._id,
      upvoteCount: 5,
      downvoteCount: 0,
      commentCount: 1,
    },

    // Design Corner posts
    {
      author: bob._id,
      content: "Welcome to Design Corner! Share your work and get feedback from other designers.",
      community: designCommunity._id,
      upvoteCount: 10,
      downvoteCount: 0,
      commentCount: 2,
    },
    {
      author: alice._id,
      content: "I've been working on a new UI design system. Would love to get some feedback!",
      community: designCommunity._id,
      upvoteCount: 7,
      downvoteCount: 1,
      commentCount: 1,
    },

    // Private Discussion posts
    {
      author: alice._id,
      content: "This is a private community for discussing sensitive topics.",
      community: privateCommunity._id,
      upvoteCount: 2,
      downvoteCount: 0,
      commentCount: 1,
    },
    {
      author: bob._id,
      content: "Thanks for inviting me to this private community!",
      community: privateCommunity._id,
      upvoteCount: 1,
      downvoteCount: 0,
      commentCount: 0,
    },

    // Posts without community (personal posts)
    {
      author: charlie._id,
      content: "Just sharing some thoughts on my personal feed.",
      upvoteCount: 3,
      downvoteCount: 1,
      commentCount: 0,
    },
    {
      author: moderator._id,
      content: "Hello everyone! I'm new to ChatterSphere.",
      upvoteCount: 5,
      downvoteCount: 0,
      commentCount: 1,
    },
  ];

  return await Post.create(posts);
}

/**
 * Create sample comments
 */
async function createComments(users: any[], posts: any[]) {
  const [admin, moderator, alice, bob, charlie] = users;

  const comments = [];

  // Comments for the first post (Welcome to Tech Enthusiasts)
  comments.push({
    author: moderator._id,
    post: posts[0]._id,
    content: "Excited to be part of this community!",
    upvoteCount: 3,
    downvoteCount: 0,
  });

  comments.push({
    author: alice._id,
    post: posts[0]._id,
    content: "Looking forward to the discussions here.",
    upvoteCount: 2,
    downvoteCount: 0,
  });

  comments.push({
    author: charlie._id,
    post: posts[0]._id,
    content: "Great to see a tech community on ChatterSphere!",
    upvoteCount: 1,
    downvoteCount: 0,
  });

  // Comments for the second post (AI advancements)
  comments.push({
    author: admin._id,
    post: posts[1]._id,
    content: "Large language models have made incredible progress in the last few years.",
    upvoteCount: 4,
    downvoteCount: 0,
  });

  comments.push({
    author: bob._id,
    post: posts[1]._id,
    content: "I'm curious about the ethical implications of these AI models.",
    upvoteCount: 3,
    downvoteCount: 1,
  });

  // Comment for the third post (mechanical keyboard)
  comments.push({
    author: charlie._id,
    post: posts[2]._id,
    content: "Which keyboard did you get? I've been thinking about getting one too.",
    upvoteCount: 2,
    downvoteCount: 0,
  });

  // Comments for Design Corner welcome post
  comments.push({
    author: alice._id,
    post: posts[3]._id,
    content: "Thanks for creating this community!",
    upvoteCount: 2,
    downvoteCount: 0,
  });

  comments.push({
    author: charlie._id,
    post: posts[3]._id,
    content: "Looking forward to sharing my designs here.",
    upvoteCount: 1,
    downvoteCount: 0,
  });

  // Comment for UI design system post
  comments.push({
    author: bob._id,
    post: posts[4]._id,
    content: "Your design system looks great! I especially like the color palette.",
    upvoteCount: 3,
    downvoteCount: 0,
  });

  // Comment for private community post
  comments.push({
    author: bob._id,
    post: posts[5]._id,
    content: "This is a good place for private discussions.",
    upvoteCount: 1,
    downvoteCount: 0,
  });

  // Comment for moderator's personal post
  comments.push({
    author: admin._id,
    post: posts[8]._id,
    content: "Welcome to ChatterSphere!",
    upvoteCount: 2,
    downvoteCount: 0,
  });

  return await Comment.create(comments);
}

// Run the seed function
seedData();
