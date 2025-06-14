// scripts/migrate-votes.js
// This script migrates votes from the old schema (arrays in Post and Comment) to the new Vote model
// It also updates the upvoteCount, downvoteCount, and commentCount fields in Post and Comment models

require("dotenv").config();
const mongoose = require("mongoose");

// Define VoteType enum directly in the script
const VoteType = {
  UPVOTE: "UPVOTE",
  DOWNVOTE: "DOWNVOTE",
};

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
const PostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String },
    community: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    mediaUrls: [{ type: String }],
    upvoteCount: { type: Number, default: 0 },
    downvoteCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CommentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    content: { type: String },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    upvoteCount: { type: Number, default: 0 },
    downvoteCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const VoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["Post", "Comment"], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, refPath: "targetType", required: true },
    voteType: { type: String, enum: Object.values(VoteType), required: true },
  },
  { timestamps: true }
);

// Create compound index for user and target to ensure a user can only have one vote per target
VoteSchema.index({ user: 1, target: 1 }, { unique: true });

// Create models
const Post = mongoose.model("Post", PostSchema);
const Comment = mongoose.model("Comment", CommentSchema);
const Vote = mongoose.model("Vote", VoteSchema);

// Migrate post votes
const migratePostVotes = async () => {
  console.log("Migrating post votes...");
  const posts = await Post.find({});
  console.log(`Found ${posts.length} posts to process`);

  let totalVotes = 0;

  for (const post of posts) {
    // Set the upvoteCount and downvoteCount
    post.upvoteCount = post.upvotes.length;
    post.downvoteCount = post.downvotes.length;
    post.commentCount = post.comments.length;

    // Create votes for each upvote
    for (const userId of post.upvotes) {
      try {
        await Vote.findOneAndUpdate(
          { user: userId, target: post._id, targetType: "Post" },
          { voteType: VoteType.UPVOTE },
          { upsert: true, new: true }
        );
        totalVotes++;
      } catch (error) {
        console.error(`Error creating upvote for post ${post._id} and user ${userId}:`, error);
      }
    }

    // Create votes for each downvote
    for (const userId of post.downvotes) {
      try {
        await Vote.findOneAndUpdate(
          { user: userId, target: post._id, targetType: "Post" },
          { voteType: VoteType.DOWNVOTE },
          { upsert: true, new: true }
        );
        totalVotes++;
      } catch (error) {
        console.error(`Error creating downvote for post ${post._id} and user ${userId}:`, error);
      }
    }

    // Save the post with updated counts
    await post.save();
  }

  console.log(`Migrated ${totalVotes} post votes`);
};

// Migrate comment votes
const migrateCommentVotes = async () => {
  console.log("Migrating comment votes...");
  const comments = await Comment.find({});
  console.log(`Found ${comments.length} comments to process`);

  let totalVotes = 0;

  for (const comment of comments) {
    // Set the upvoteCount and downvoteCount
    comment.upvoteCount = comment.upvotes.length;
    comment.downvoteCount = comment.downvotes.length;

    // Create votes for each upvote
    for (const userId of comment.upvotes) {
      try {
        await Vote.findOneAndUpdate(
          { user: userId, target: comment._id, targetType: "Comment" },
          { voteType: VoteType.UPVOTE },
          { upsert: true, new: true }
        );
        totalVotes++;
      } catch (error) {
        console.error(
          `Error creating upvote for comment ${comment._id} and user ${userId}:`,
          error
        );
      }
    }

    // Create votes for each downvote
    for (const userId of comment.downvotes) {
      try {
        await Vote.findOneAndUpdate(
          { user: userId, target: comment._id, targetType: "Comment" },
          { voteType: VoteType.DOWNVOTE },
          { upsert: true, new: true }
        );
        totalVotes++;
      } catch (error) {
        console.error(
          `Error creating downvote for comment ${comment._id} and user ${userId}:`,
          error
        );
      }
    }

    // Save the comment with updated counts
    await comment.save();
  }

  console.log(`Migrated ${totalVotes} comment votes`);
};

// Update post comment counts
const updatePostCommentCounts = async () => {
  console.log("Updating post comment counts...");
  const posts = await Post.find({});

  for (const post of posts) {
    const commentCount = await Comment.countDocuments({ post: post._id });
    post.commentCount = commentCount;
    await post.save();
  }

  console.log("Post comment counts updated");
};

// Main migration function
const migrate = async () => {
  await connectToDatabase();

  try {
    await migratePostVotes();
    await migrateCommentVotes();
    await updatePostCommentCounts();

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
