/**
 * Archive Data Script
 *
 * This script archives old data from the database to improve performance.
 *
 * Usage:
 * 1. Run this script with: npm run archive-data
 * 2. Optionally specify collections to archive: npm run archive-data -- --collections=posts,comments
 * 3. Optionally specify threshold days: npm run archive-data -- --days=60
 */

import dbConnect from "../lib/dbConnect";
import {
  archiveOldPosts,
  archiveOldComments,
  archiveOldNotifications,
  archiveOldActivities,
  runAllArchivingTasks,
} from "../lib/archiving";

// Parse command line arguments
const args = process.argv.slice(2);
const collections =
  args
    .find((arg) => arg.startsWith("--collections="))
    ?.split("=")[1]
    ?.split(",") || [];
const thresholdDays = parseInt(
  args.find((arg) => arg.startsWith("--days="))?.split("=")[1] || "90",
  10
);

/**
 * Main function to run archiving tasks
 */
async function main() {
  console.log("🗄️ Starting data archiving...");

  try {
    // Connect to the database
    await dbConnect();
    console.log("📊 Connected to database");

    // Run specific collections or all
    if (collections.length > 0) {
      console.log(`Archiving specific collections: ${collections.join(", ")}`);
      console.log(`Using threshold of ${thresholdDays} days`);

      const results: Record<string, number> = {};

      // Archive posts
      if (collections.includes("posts")) {
        results.posts = await archiveOldPosts(thresholdDays);
      }

      // Archive comments
      if (collections.includes("comments")) {
        results.comments = await archiveOldComments(thresholdDays);
      }

      // Archive notifications
      if (collections.includes("notifications")) {
        results.notifications = await archiveOldNotifications(thresholdDays);
      }

      // Archive activities
      if (collections.includes("activities")) {
        results.activities = await archiveOldActivities(thresholdDays);
      }

      console.log("Archiving results:", results);
    } else {
      console.log("Archiving all collections");
      console.log(`Using threshold of ${thresholdDays} days`);

      // Run all archiving tasks
      const results = await runAllArchivingTasks();

      console.log("Archiving results:", results);
    }

    console.log("✅ Data archiving completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error archiving data:", error);
    process.exit(1);
  }
}

// Run the script
main();
