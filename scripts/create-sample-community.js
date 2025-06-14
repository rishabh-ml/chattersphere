// scripts/create-sample-community.js
require("dotenv").config();
const mongoose = require("mongoose");

// Define the generateSlug function directly in this script
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
}

// Define the generateUniqueSlug function directly in this script
async function generateUniqueSlug(name, model, existingId) {
  // Generate the base slug
  let slug = generateSlug(name);

  // If the slug is empty (e.g., if name contained only special characters),
  // use a fallback
  if (!slug) {
    slug = "untitled";
  }

  // Check if the slug already exists
  let exists = await model.findOne({
    slug,
    ...(existingId ? { _id: { $ne: existingId } } : {}),
  });

  // If the slug exists, append a number and check again
  let counter = 1;
  let uniqueSlug = slug;

  while (exists) {
    uniqueSlug = `${slug}-${counter}`;
    exists = await model.findOne({
      slug: uniqueSlug,
      ...(existingId ? { _id: { $ne: existingId } } : {}),
    });
    counter++;
  }

  return uniqueSlug;
}

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
const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  communities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Community" }],
});

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
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    channels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Channel" }],
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
  },
  { timestamps: true }
);

// Register models
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Community = mongoose.models.Community || mongoose.model("Community", CommunitySchema);

// Create a sample community
const createSampleCommunity = async () => {
  try {
    // Check if any communities exist
    const communityCount = await Community.countDocuments();

    if (communityCount > 0) {
      console.log(`${communityCount} communities already exist. Here are the first 5:`);
      const communities = await Community.find().limit(5);

      // Check for communities with missing slugs
      let fixedSlugs = 0;

      for (const community of communities) {
        console.log(`- ${community.name} (slug: ${community.slug || "missing"})`);

        // Fix missing slugs
        if (!community.slug) {
          const newSlug = await generateUniqueSlug(community.name, Community, community._id);
          console.log(`  Fixing missing slug for "${community.name}" -> "${newSlug}"`);

          community.slug = newSlug;
          await community.save();
          fixedSlugs++;
        }
      }

      if (fixedSlugs > 0) {
        console.log(`Fixed ${fixedSlugs} communities with missing slugs.`);
      }

      return;
    }

    // Find or create a user
    let user = await User.findOne();

    if (!user) {
      console.log("No users found. Creating a sample user...");
      user = await User.create({
        clerkId: "sample_clerk_id",
        username: "sampleuser",
        name: "Sample User",
        email: "sample@example.com",
        communities: [],
      });
      console.log("Created sample user:", user.username);
    } else {
      console.log("Using existing user:", user.username);
    }

    // Create a sample community
    const communityName = "General Discussion";
    const slug = await generateUniqueSlug(communityName, Community);

    const community = await Community.create({
      name: communityName,
      slug,
      description: "A general discussion community for all topics.",
      creator: user._id,
      members: [user._id],
      moderators: [user._id],
      posts: [],
      channels: [],
      roles: [],
    });

    // Update user's communities
    user.communities.push(community._id);
    await user.save();

    console.log("Created sample community:", community.name);
    console.log("Slug:", community.slug);
    console.log("ID:", community._id);
  } catch (error) {
    console.error("Error creating sample community:", error);
  }
};

// Main function
const main = async () => {
  await connectToDatabase();
  await createSampleCommunity();
  mongoose.connection.close();
};

main();
