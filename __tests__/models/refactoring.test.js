// __tests__/models/refactoring.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Models
const Post = require('../../src/models/Post').default;
const Comment = require('../../src/models/Comment').default;
const Community = require('../../src/models/Community').default;
const User = require('../../src/models/User').default;
const Membership = require('../../src/models/Membership').default;
const Vote = require('../../src/models/Vote').default;

// Define VoteType enum directly in the test
const VoteType = {
  UPVOTE: 'UPVOTE',
  DOWNVOTE: 'DOWNVOTE'
};

// Define MembershipStatus enum directly in the test
const MembershipStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  BANNED: 'BANNED'
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Model Refactoring Tests', () => {
  let user1, user2, community, post, comment;

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Community.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Membership.deleteMany({});
    await Vote.deleteMany({});

    // Create test users
    user1 = await User.create({
      clerkId: 'user1',
      username: 'testuser1',
      name: 'Test User 1',
      email: 'test1@example.com'
    });

    user2 = await User.create({
      clerkId: 'user2',
      username: 'testuser2',
      name: 'Test User 2',
      email: 'test2@example.com'
    });

    // Create test community
    community = await Community.create({
      name: 'Test Community',
      slug: 'test-community',
      description: 'A test community',
      creator: user1._id,
      members: [user1._id],
      moderators: [user1._id]
    });

    // Create membership for user1
    await Membership.create({
      user: user1._id,
      community: community._id,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date()
    });

    // Create test post
    post = await Post.create({
      author: user1._id,
      content: 'Test post content',
      community: community._id,
      upvoteCount: 0,
      downvoteCount: 0,
      commentCount: 0
    });

    // Create test comment
    comment = await Comment.create({
      author: user1._id,
      post: post._id,
      content: 'Test comment content',
      upvoteCount: 0,
      downvoteCount: 0
    });
  });

  test('Vote model should work correctly for posts', async () => {
    // User2 upvotes the post
    await Vote.create({
      user: user2._id,
      target: post._id,
      targetType: 'Post',
      voteType: VoteType.UPVOTE
    });

    // Update post upvote count
    post.upvoteCount += 1;
    await post.save();

    // Fetch the post
    const updatedPost = await Post.findById(post._id);
    expect(updatedPost.upvoteCount).toBe(1);
    expect(updatedPost.downvoteCount).toBe(0);

    // Check if vote exists
    const vote = await Vote.findOne({
      user: user2._id,
      target: post._id,
      targetType: 'Post'
    });

    expect(vote).toBeTruthy();
    expect(vote.voteType).toBe(VoteType.UPVOTE);

    // Change vote to downvote
    vote.voteType = VoteType.DOWNVOTE;
    await vote.save();

    // Update post vote counts
    updatedPost.upvoteCount -= 1;
    updatedPost.downvoteCount += 1;
    await updatedPost.save();

    // Fetch the post again
    const reUpdatedPost = await Post.findById(post._id);
    expect(reUpdatedPost.upvoteCount).toBe(0);
    expect(reUpdatedPost.downvoteCount).toBe(1);
  });

  test('Vote model should work correctly for comments', async () => {
    // User2 upvotes the comment
    await Vote.create({
      user: user2._id,
      target: comment._id,
      targetType: 'Comment',
      voteType: VoteType.UPVOTE
    });

    // Update comment upvote count
    comment.upvoteCount += 1;
    await comment.save();

    // Fetch the comment
    const updatedComment = await Comment.findById(comment._id);
    expect(updatedComment.upvoteCount).toBe(1);
    expect(updatedComment.downvoteCount).toBe(0);

    // Check if vote exists
    const vote = await Vote.findOne({
      user: user2._id,
      target: comment._id,
      targetType: 'Comment'
    });

    expect(vote).toBeTruthy();
    expect(vote.voteType).toBe(VoteType.UPVOTE);
  });

  test('Membership model should work correctly', async () => {
    // Add user2 to community
    await Membership.create({
      user: user2._id,
      community: community._id,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date()
    });

    // Check if user2 is a member using the Membership model
    const membership = await Membership.findOne({
      user: user2._id,
      community: community._id,
      status: MembershipStatus.ACTIVE
    });

    expect(membership).toBeTruthy();

    // Count members using Membership model
    const memberCount = await Membership.countDocuments({
      community: community._id,
      status: MembershipStatus.ACTIVE
    });

    expect(memberCount).toBe(2);

    // Check if community.isMember works with the new model
    const isMember = await community.isMember(user2._id);
    expect(isMember).toBe(true);
  });

  test('Post comment count should update correctly', async () => {
    // Create another comment
    await Comment.create({
      author: user2._id,
      post: post._id,
      content: 'Another test comment',
      upvoteCount: 0,
      downvoteCount: 0
    });

    // Update post comment count
    post.commentCount += 1;
    await post.save();

    // Fetch the post
    const updatedPost = await Post.findById(post._id);
    expect(updatedPost.commentCount).toBe(1);

    // Count comments directly
    const commentCount = await Comment.countDocuments({ post: post._id });
    expect(commentCount).toBe(2);
  });
});
