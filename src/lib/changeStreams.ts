import mongoose from 'mongoose';
import { invalidateCache } from '@/lib/redis';

/**
 * Sets up MongoDB Change Streams to listen for changes to collections
 * and invalidate relevant caches
 */
export async function setupChangeStreams() {
  // Only set up change streams if we're in a production environment
  // and the database is connected
  if (process.env.NODE_ENV !== 'production') {
    console.log('Change streams not enabled in development mode');
    return;
  }

  try {
    // Ensure we have a connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Cannot set up change streams: MongoDB not connected');
      return;
    }

    console.log('Setting up MongoDB change streams...');

    // Set up change stream for Posts collection
    setupPostsChangeStream();

    // Set up change stream for Communities collection
    setupCommunitiesChangeStream();

    // Set up change stream for Comments collection
    setupCommentsChangeStream();

    // Set up change stream for Memberships collection
    setupMembershipsChangeStream();

    console.log('MongoDB change streams set up successfully');
  } catch (error) {
    console.error('Failed to set up MongoDB change streams:', error);
  }
}

/**
 * Sets up a change stream for the Posts collection
 */
function setupPostsChangeStream() {
  const postChangeStream = mongoose.model('Post').watch();

  postChangeStream.on('change', async (change) => {
    console.log(`Post change detected: ${change.operationType}`);

    // Get the post ID
    const postId = change.documentKey?._id?.toString();
    
    // Invalidate caches based on the operation type
    switch (change.operationType) {
      case 'insert':
        // New post - invalidate feed caches and community post caches
        if (change.fullDocument?.community) {
          const communityId = change.fullDocument.community.toString();
          await invalidateCache(`community:${communityId}:posts:*`);
        }
        await invalidateCache('posts:*');
        await invalidateCache('feed:*');
        break;
        
      case 'update':
        // Updated post - invalidate specific post cache and any feeds
        if (postId) {
          await invalidateCache(`post:${postId}`);
        }
        await invalidateCache('posts:*');
        await invalidateCache('feed:*');
        break;
        
      case 'delete':
        // Deleted post - invalidate all related caches
        if (postId) {
          await invalidateCache(`post:${postId}`);
          await invalidateCache(`post:${postId}:comments:*`);
        }
        await invalidateCache('posts:*');
        await invalidateCache('feed:*');
        break;
        
      default:
        // For other operations, invalidate general post caches
        await invalidateCache('posts:*');
    }
  });

  postChangeStream.on('error', (error) => {
    console.error('Error in Posts change stream:', error);
    // Try to restart the stream after a delay
    setTimeout(() => setupPostsChangeStream(), 5000);
  });
}

/**
 * Sets up a change stream for the Communities collection
 */
function setupCommunitiesChangeStream() {
  const communityChangeStream = mongoose.model('Community').watch();

  communityChangeStream.on('change', async (change) => {
    console.log(`Community change detected: ${change.operationType}`);

    // Get the community ID
    const communityId = change.documentKey?._id?.toString();
    
    // Invalidate caches based on the operation type
    switch (change.operationType) {
      case 'insert':
        // New community - invalidate communities list cache
        await invalidateCache('communities:*');
        break;
        
      case 'update':
        // Updated community - invalidate specific community cache and lists
        if (communityId) {
          await invalidateCache(`community:${communityId}:*`);
        }
        await invalidateCache('communities:*');
        break;
        
      case 'delete':
        // Deleted community - invalidate all related caches
        if (communityId) {
          await invalidateCache(`community:${communityId}:*`);
        }
        await invalidateCache('communities:*');
        break;
        
      default:
        // For other operations, invalidate general community caches
        await invalidateCache('communities:*');
    }
  });

  communityChangeStream.on('error', (error) => {
    console.error('Error in Communities change stream:', error);
    // Try to restart the stream after a delay
    setTimeout(() => setupCommunitiesChangeStream(), 5000);
  });
}

/**
 * Sets up a change stream for the Comments collection
 */
function setupCommentsChangeStream() {
  const commentChangeStream = mongoose.model('Comment').watch();

  commentChangeStream.on('change', async (change) => {
    console.log(`Comment change detected: ${change.operationType}`);

    // Get the comment ID and post ID
    const commentId = change.documentKey?._id?.toString();
    const postId = change.fullDocument?.post?.toString();
    
    // Invalidate caches based on the operation type
    switch (change.operationType) {
      case 'insert':
      case 'update':
      case 'delete':
        // For any comment change, invalidate the related post's comments cache
        if (postId) {
          await invalidateCache(`post:${postId}:comments:*`);
          await invalidateCache(`post:${postId}`);
        }
        break;
        
      default:
        // For other operations, do nothing specific
        break;
    }
  });

  commentChangeStream.on('error', (error) => {
    console.error('Error in Comments change stream:', error);
    // Try to restart the stream after a delay
    setTimeout(() => setupCommentsChangeStream(), 5000);
  });
}

/**
 * Sets up a change stream for the Memberships collection
 */
function setupMembershipsChangeStream() {
  const membershipChangeStream = mongoose.model('Membership').watch();

  membershipChangeStream.on('change', async (change) => {
    console.log(`Membership change detected: ${change.operationType}`);

    // Get the community ID and user ID
    const communityId = change.fullDocument?.community?.toString();
    const userId = change.fullDocument?.user?.toString();
    
    // Invalidate caches based on the operation type
    switch (change.operationType) {
      case 'insert':
      case 'update':
      case 'delete':
        // For any membership change, invalidate the related community's members cache
        if (communityId) {
          await invalidateCache(`community:${communityId}:members:*`);
          await invalidateCache(`community:${communityId}:*`);
        }
        
        // Also invalidate the user's communities cache
        if (userId) {
          await invalidateCache(`user:${userId}:communities:*`);
          await invalidateCache(`user:${userId}:*`);
        }
        break;
        
      default:
        // For other operations, do nothing specific
        break;
    }
  });

  membershipChangeStream.on('error', (error) => {
    console.error('Error in Memberships change stream:', error);
    // Try to restart the stream after a delay
    setTimeout(() => setupMembershipsChangeStream(), 5000);
  });
}
