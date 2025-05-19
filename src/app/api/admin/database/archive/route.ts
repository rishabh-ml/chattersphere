import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/dbConnect';
import {
  archiveOldPosts,
  archiveOldComments,
  archiveOldNotifications,
  archiveOldActivities,
} from '@/lib/archiving';
import { withApiMiddleware } from '@/lib/apiUtils';

/**
 * POST /api/admin/database/archive - Archive old data
 */
async function archiveDataHandler(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, you would check if the user is an admin
    // For now, we'll just check if the user is authenticated

    // Parse the request body
    const body = await req.json();
    const { collections, thresholdDays } = body;

    if (!collections || !Array.isArray(collections) || collections.length === 0) {
      return NextResponse.json({ error: 'No collections specified' }, { status: 400 });
    }

    // Validate threshold days
    const validThresholdDays = Math.max(1, Math.min(365, thresholdDays || 90));

    // Connect to the database
    await connectToDatabase();

    // Run archiving tasks
    const results: Record<string, number> = {};

    // Archive posts
    if (collections.includes('posts')) {
      results.posts = await archiveOldPosts(validThresholdDays);
    }

    // Archive comments
    if (collections.includes('comments')) {
      results.comments = await archiveOldComments(validThresholdDays);
    }

    // Archive notifications
    if (collections.includes('notifications')) {
      results.notifications = await archiveOldNotifications(validThresholdDays);
    }

    // Archive activities
    if (collections.includes('activities')) {
      results.activities = await archiveOldActivities(validThresholdDays);
    }

    return NextResponse.json({
      message: 'Data archived successfully',
      results,
    }, { status: 200 });
  } catch (error) {
    console.error('Error archiving data:', error);
    return NextResponse.json({ error: 'Failed to archive data' }, { status: 500 });
  }
}

// Export the handler function with middleware
export const POST = withApiMiddleware(archiveDataHandler, {
  enableRateLimit: true,
  maxRequests: 5,
  windowMs: 60000, // 1 minute
  identifier: 'admin:database:archive:post'
});
