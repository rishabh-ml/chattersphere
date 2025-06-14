/**
 * Performance Test Script
 *
 * This script tests the performance of various API endpoints and database operations.
 *
 * Usage:
 * 1. Make sure the development server is running
 * 2. Run this script with: npx ts-node -r tsconfig-paths/register src/scripts/performance-test.ts
 */

import {
  runPerformanceTest,
  comparePerformance,
  simulateLoadTest,
  testDatabaseQueryPerformance,
  compareDatabaseQueries,
} from "../lib/performanceTesting";
import dbConnect from "../lib/dbConnect";
import Post from "../models/Post";
import User from "../models/User";
import Community from "../models/Community";
import Comment from "../models/Comment";
import mongoose from "mongoose";

// Base URL for API endpoints
const BASE_URL = "http://localhost:3000/api";

// Test configuration
const API_TEST_ITERATIONS = 5;
const DB_TEST_ITERATIONS = 10;
const LOAD_TEST_CONCURRENT_REQUESTS = 5;
const LOAD_TEST_TOTAL_REQUESTS = 20;

/**
 * Main function to run all tests
 */
async function runTests() {
  console.log("🧪 Starting performance tests...");

  // Connect to the database
  await dbConnect();
  console.log("📊 Connected to database");

  // Test API endpoints
  await testApiEndpoints();

  // Test database queries
  await testDatabaseQueries();

  // Test load handling
  await testLoadHandling();

  // Disconnect from the database
  await mongoose.disconnect();
  console.log("🏁 Performance tests completed");
}

/**
 * Test API endpoints
 */
async function testApiEndpoints() {
  console.log("\n📡 Testing API Endpoints...");

  // Test posts endpoint
  console.log("\n🔍 Testing /api/posts endpoint...");
  const postsResult = await runPerformanceTest(
    async () => {
      const response = await fetch(`${BASE_URL}/posts?page=1&limit=10`);
      if (!response.ok) throw new Error(`Failed to fetch posts: ${response.status}`);
      return response.json();
    },
    [],
    API_TEST_ITERATIONS
  );

  console.log(`  Average response time: ${postsResult.averageTime.toFixed(2)}ms`);
  console.log(`  Min response time: ${postsResult.minTime.toFixed(2)}ms`);
  console.log(`  Max response time: ${postsResult.maxTime.toFixed(2)}ms`);

  // Test popular posts endpoint
  console.log("\n🔍 Testing /api/posts/popular endpoint...");
  const popularPostsResult = await runPerformanceTest(
    async () => {
      const response = await fetch(`${BASE_URL}/posts/popular?page=1&limit=10`);
      if (!response.ok) throw new Error(`Failed to fetch popular posts: ${response.status}`);
      return response.json();
    },
    [],
    API_TEST_ITERATIONS
  );

  console.log(`  Average response time: ${popularPostsResult.averageTime.toFixed(2)}ms`);
  console.log(`  Min response time: ${popularPostsResult.minTime.toFixed(2)}ms`);
  console.log(`  Max response time: ${popularPostsResult.maxTime.toFixed(2)}ms`);

  // Test communities endpoint
  console.log("\n🔍 Testing /api/communities endpoint...");
  const communitiesResult = await runPerformanceTest(
    async () => {
      const response = await fetch(`${BASE_URL}/communities?page=1&limit=10`);
      if (!response.ok) throw new Error(`Failed to fetch communities: ${response.status}`);
      return response.json();
    },
    [],
    API_TEST_ITERATIONS
  );

  console.log(`  Average response time: ${communitiesResult.averageTime.toFixed(2)}ms`);
  console.log(`  Min response time: ${communitiesResult.minTime.toFixed(2)}ms`);
  console.log(`  Max response time: ${communitiesResult.maxTime.toFixed(2)}ms`);
}

/**
 * Test database queries
 */
async function testDatabaseQueries() {
  console.log("\n🗄️ Testing Database Queries...");

  // Get a sample post ID for testing
  const samplePost = await Post.findOne().sort({ createdAt: -1 }).lean();
  if (!samplePost) {
    console.log("❌ No posts found for testing");
    return;
  }

  // Get a sample community ID for testing
  const sampleCommunity = await Community.findOne().sort({ createdAt: -1 }).lean();
  if (!sampleCommunity) {
    console.log("❌ No communities found for testing");
    return;
  }

  // Test regular find vs. aggregation for posts
  console.log("\n🔍 Comparing find() vs. aggregate() for posts...");

  const findQuery = async () => {
    return Post.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("author", "username name image")
      .populate("community", "name image")
      .lean();
  };

  const aggregateQuery = async () => {
    return Post.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorInfo",
        },
      },
      { $unwind: "$authorInfo" },
      {
        $lookup: {
          from: "communities",
          localField: "community",
          foreignField: "_id",
          as: "communityInfo",
        },
      },
      { $unwind: { path: "$communityInfo", preserveNullAndEmptyArrays: true } },
    ]);
  };

  const queryComparison = await compareDatabaseQueries(
    findQuery,
    aggregateQuery,
    DB_TEST_ITERATIONS
  );

  console.log(`  Find query average time: ${queryComparison.queryA.averageTime.toFixed(2)}ms`);
  console.log(`  Aggregate query average time: ${queryComparison.queryB.averageTime.toFixed(2)}ms`);
  console.log(
    `  Difference: ${queryComparison.difference.averageTime.toFixed(2)}ms (${queryComparison.difference.percentage.toFixed(2)}%)`
  );
  console.log(`  Faster query: ${queryComparison.fasterQuery}`);

  // Test comments query performance
  console.log("\n🔍 Testing comments query performance...");

  const commentsQuery = async () => {
    return Comment.find({ post: samplePost._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("author", "username name image")
      .lean();
  };

  const commentsAggregateQuery = async () => {
    return Comment.aggregate([
      { $match: { post: samplePost._id } },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorInfo",
        },
      },
      { $unwind: "$authorInfo" },
    ]);
  };

  const commentsComparison = await compareDatabaseQueries(
    commentsQuery,
    commentsAggregateQuery,
    DB_TEST_ITERATIONS
  );

  console.log(`  Find query average time: ${commentsComparison.queryA.averageTime.toFixed(2)}ms`);
  console.log(
    `  Aggregate query average time: ${commentsComparison.queryB.averageTime.toFixed(2)}ms`
  );
  console.log(
    `  Difference: ${commentsComparison.difference.averageTime.toFixed(2)}ms (${commentsComparison.difference.percentage.toFixed(2)}%)`
  );
  console.log(`  Faster query: ${commentsComparison.fasterQuery}`);

  // Test community members query performance
  console.log("\n🔍 Testing community members query performance...");
  const membersQuery = async () => {
    return User.find({ communities: (sampleCommunity as any)._id })
      .sort({ username: 1 })
      .limit(10)
      .lean();
  };

  const membersAggregateQuery = async () => {
    return User.aggregate([
      { $match: { communities: (sampleCommunity as any)._id } },
      { $sort: { username: 1 } },
      { $limit: 10 },
    ]);
  };

  const membersComparison = await compareDatabaseQueries(
    membersQuery,
    membersAggregateQuery,
    DB_TEST_ITERATIONS
  );

  console.log(`  Find query average time: ${membersComparison.queryA.averageTime.toFixed(2)}ms`);
  console.log(
    `  Aggregate query average time: ${membersComparison.queryB.averageTime.toFixed(2)}ms`
  );
  console.log(
    `  Difference: ${membersComparison.difference.averageTime.toFixed(2)}ms (${membersComparison.difference.percentage.toFixed(2)}%)`
  );
  console.log(`  Faster query: ${membersComparison.fasterQuery}`);
}

/**
 * Test load handling
 */
async function testLoadHandling() {
  console.log("\n🔥 Testing Load Handling...");

  // Test posts endpoint under load
  console.log("\n🔍 Testing /api/posts endpoint under load...");
  const postsLoadTest = await simulateLoadTest(
    `${BASE_URL}/posts?page=1&limit=10`,
    { method: "GET" },
    LOAD_TEST_CONCURRENT_REQUESTS,
    LOAD_TEST_TOTAL_REQUESTS
  );

  console.log(`  Total time: ${postsLoadTest.totalTime}ms`);
  console.log(`  Average response time: ${postsLoadTest.averageResponseTime.toFixed(2)}ms`);
  console.log(`  Requests per second: ${postsLoadTest.requestsPerSecond.toFixed(2)}`);
  console.log(`  Success rate: ${postsLoadTest.successRate.toFixed(2)}%`);
  console.log(`  Status codes: ${JSON.stringify(postsLoadTest.statusCodes)}`);

  // Test communities endpoint under load
  console.log("\n🔍 Testing /api/communities endpoint under load...");
  const communitiesLoadTest = await simulateLoadTest(
    `${BASE_URL}/communities?page=1&limit=10`,
    { method: "GET" },
    LOAD_TEST_CONCURRENT_REQUESTS,
    LOAD_TEST_TOTAL_REQUESTS
  );

  console.log(`  Total time: ${communitiesLoadTest.totalTime}ms`);
  console.log(`  Average response time: ${communitiesLoadTest.averageResponseTime.toFixed(2)}ms`);
  console.log(`  Requests per second: ${communitiesLoadTest.requestsPerSecond.toFixed(2)}`);
  console.log(`  Success rate: ${communitiesLoadTest.successRate.toFixed(2)}%`);
  console.log(`  Status codes: ${JSON.stringify(communitiesLoadTest.statusCodes)}`);

  // Test popular posts endpoint under load
  console.log("\n🔍 Testing /api/posts/popular endpoint under load...");
  const popularPostsLoadTest = await simulateLoadTest(
    `${BASE_URL}/posts/popular?page=1&limit=10`,
    { method: "GET" },
    LOAD_TEST_CONCURRENT_REQUESTS,
    LOAD_TEST_TOTAL_REQUESTS
  );

  console.log(`  Total time: ${popularPostsLoadTest.totalTime}ms`);
  console.log(`  Average response time: ${popularPostsLoadTest.averageResponseTime.toFixed(2)}ms`);
  console.log(`  Requests per second: ${popularPostsLoadTest.requestsPerSecond.toFixed(2)}`);
  console.log(`  Success rate: ${popularPostsLoadTest.successRate.toFixed(2)}%`);
  console.log(`  Status codes: ${JSON.stringify(popularPostsLoadTest.statusCodes)}`);
}

// Run the tests
runTests().catch((error) => {
  console.error("❌ Error running performance tests:", error);
  process.exit(1);
});
