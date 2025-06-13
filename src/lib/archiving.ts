/**
 * Database Archiving Utilities
 * 
 * This file contains utilities for archiving old data in the database.
 * It helps manage database size and improve performance by moving
 * old data to archive collections.
 */

import mongoose from 'mongoose';
import { monitorQuery } from './monitoring';

// Archive collection name prefix
const ARCHIVE_PREFIX = 'archive_';

// Default archive threshold in days
const DEFAULT_ARCHIVE_THRESHOLD_DAYS = 90; // 3 months

/**
 * Archive old data from a collection
 * @param collectionName Collection name to archive from
 * @param dateField Date field to use for determining age
 * @param thresholdDays Age threshold in days (default: 90 days)
 * @param batchSize Number of documents to archive in each batch (default: 1000)
 * @returns Number of documents archived
 */
export async function archiveOldData(
  collectionName: string,
  dateField: string = 'createdAt',
  thresholdDays: number = DEFAULT_ARCHIVE_THRESHOLD_DAYS,
  batchSize: number = 1000
): Promise<number> {
  // Calculate the threshold date
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);
    // Get the source and destination collections
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection not available');
  
  const sourceCollection = db.collection(collectionName);
  const archiveCollection = db.collection(`${ARCHIVE_PREFIX}${collectionName}`);
  
  // Create indexes on the archive collection if they don't exist
  await archiveCollection.createIndex({ _id: 1 });
  await archiveCollection.createIndex({ [dateField]: 1 });
  
  // Find documents to archive
  const query = { [dateField]: { $lt: thresholdDate } };
  const totalCount = await sourceCollection.countDocuments(query);
  
  if (totalCount === 0) {
    console.log(`No documents to archive from ${collectionName}`);
    return 0;
  }
  
  console.log(`Found ${totalCount} documents to archive from ${collectionName}`);
  
  // Archive in batches
  let archivedCount = 0;
  let cursor = sourceCollection.find(query).limit(batchSize);
  let batch = await cursor.toArray();
  
  while (batch.length > 0) {
    // Insert documents into archive collection
    if (batch.length > 0) {
      await archiveCollection.insertMany(batch);
    }
    
    // Delete documents from source collection
    const ids = batch.map(doc => doc._id);
    await sourceCollection.deleteMany({ _id: { $in: ids } });
    
    archivedCount += batch.length;
    console.log(`Archived ${archivedCount}/${totalCount} documents from ${collectionName}`);
    
    // Get next batch
    cursor = sourceCollection.find(query).limit(batchSize);
    batch = await cursor.toArray();
  }
  
  console.log(`Completed archiving ${archivedCount} documents from ${collectionName}`);
  return archivedCount;
}

/**
 * Restore archived data to the original collection
 * @param collectionName Collection name to restore to
 * @param query Query to find documents to restore
 * @param batchSize Number of documents to restore in each batch (default: 1000)
 * @returns Number of documents restored
 */
export async function restoreArchivedData(
  collectionName: string,
  query: Record<string, any> = {},
  batchSize: number = 1000
): Promise<number> {  // Get the source and destination collections
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection not available');
  
  const sourceCollection = db.collection(`${ARCHIVE_PREFIX}${collectionName}`);
  const destinationCollection = db.collection(collectionName);
  
  // Find documents to restore
  const totalCount = await sourceCollection.countDocuments(query);
  
  if (totalCount === 0) {
    console.log(`No documents to restore to ${collectionName}`);
    return 0;
  }
  
  console.log(`Found ${totalCount} documents to restore to ${collectionName}`);
  
  // Restore in batches
  let restoredCount = 0;
  let cursor = sourceCollection.find(query).limit(batchSize);
  let batch = await cursor.toArray();
  
  while (batch.length > 0) {
    // Insert documents into destination collection
    if (batch.length > 0) {
      await destinationCollection.insertMany(batch);
    }
    
    // Delete documents from source collection
    const ids = batch.map(doc => doc._id);
    await sourceCollection.deleteMany({ _id: { $in: ids } });
    
    restoredCount += batch.length;
    console.log(`Restored ${restoredCount}/${totalCount} documents to ${collectionName}`);
    
    // Get next batch
    cursor = sourceCollection.find(query).limit(batchSize);
    batch = await cursor.toArray();
  }
  
  console.log(`Completed restoring ${restoredCount} documents to ${collectionName}`);
  return restoredCount;
}

/**
 * Archive old posts
 * @param thresholdDays Age threshold in days (default: 90 days)
 * @returns Number of posts archived
 */
export async function archiveOldPosts(thresholdDays: number = DEFAULT_ARCHIVE_THRESHOLD_DAYS): Promise<number> {
  return monitorQuery(
    'archiveOldPosts',
    () => archiveOldData('posts', 'createdAt', thresholdDays),
    10000 // 10 seconds threshold
  );
}

/**
 * Archive old comments
 * @param thresholdDays Age threshold in days (default: 90 days)
 * @returns Number of comments archived
 */
export async function archiveOldComments(thresholdDays: number = DEFAULT_ARCHIVE_THRESHOLD_DAYS): Promise<number> {
  return monitorQuery(
    'archiveOldComments',
    () => archiveOldData('comments', 'createdAt', thresholdDays),
    10000 // 10 seconds threshold
  );
}

/**
 * Archive old notifications
 * @param thresholdDays Age threshold in days (default: 30 days)
 * @returns Number of notifications archived
 */
export async function archiveOldNotifications(thresholdDays: number = 30): Promise<number> {
  return monitorQuery(
    'archiveOldNotifications',
    () => archiveOldData('notifications', 'createdAt', thresholdDays),
    10000 // 10 seconds threshold
  );
}

/**
 * Archive old activities
 * @param thresholdDays Age threshold in days (default: 60 days)
 * @returns Number of activities archived
 */
export async function archiveOldActivities(thresholdDays: number = 60): Promise<number> {
  return monitorQuery(
    'archiveOldActivities',
    () => archiveOldData('activities', 'createdAt', thresholdDays),
    10000 // 10 seconds threshold
  );
}

/**
 * Run all archiving tasks
 * @returns Results of all archiving tasks
 */
export async function runAllArchivingTasks(): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  
  try {
    results.posts = await archiveOldPosts();
    results.comments = await archiveOldComments();
    results.notifications = await archiveOldNotifications();
    results.activities = await archiveOldActivities();
    
    console.log('Completed all archiving tasks:', results);
  } catch (error) {
    console.error('Error running archiving tasks:', error);
  }
  
  return results;
}
