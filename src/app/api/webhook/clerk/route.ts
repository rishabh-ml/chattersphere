import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import connectToDatabase from '@/lib/DbConnect';
import User from '@/models/User';

// Webhook handler for Clerk events
export async function POST(req: NextRequest) {
  // Get the signature and timestamp from the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with the webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 500 }
    );
  }

  // Create a new Svix instance with the webhook secret
  const wh = new Webhook(webhookSecret);

  let evt: { type: string; data: Record<string, unknown> };

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json(
      { error: 'Error verifying webhook' },
      { status: 400 }
    );
  }

  // Get the event type
  const eventType = evt.type as string;

  // Connect to the database
  await connectToDatabase();

  // Handle the event based on the type
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, username, email_addresses, image_url, first_name, last_name } = evt.data as {
      id: string;
      username?: string;
      email_addresses: Array<{ id: string; email_address: string }>;
      image_url?: string;
      first_name?: string;
      last_name?: string;
      primary_email_address_id?: string;
    };

    // Get the primary email
    const primaryEmail = email_addresses.find((email) => email.id === (evt.data as { primary_email_address_id?: string }).primary_email_address_id);
    const emailAddress = primaryEmail ? primaryEmail.email_address : email_addresses[0]?.email_address;

    if (!emailAddress) {
      return NextResponse.json(
        { error: 'No email address found' },
        { status: 400 }
      );
    }

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ clerkId: id });

      if (existingUser) {
        // Update existing user
        existingUser.username = username || `user_${id.substring(0, 8)}`;
        existingUser.name = `${first_name || ''} ${last_name || ''}`.trim() || existingUser.username;
        existingUser.email = emailAddress;
        existingUser.image = image_url;

        await existingUser.save();

        return NextResponse.json({ success: true, operation: 'updated' });
      } else {
        // Create new user
        await User.create({
          clerkId: id,
          username: username || `user_${id.substring(0, 8)}`,
          name: `${first_name || ''} ${last_name || ''}`.trim() || username || `user_${id.substring(0, 8)}`,
          email: emailAddress,
          image: image_url,
          following: [],
          followers: [],
          communities: []
        });

        return NextResponse.json({ success: true, operation: 'created' }, { status: 201 });
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      return NextResponse.json(
        { error: 'Failed to create/update user' },
        { status: 500 }
      );
    }
  } else if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      // Find and delete the user
      const deletedUser = await User.findOneAndDelete({ clerkId: id });

      if (!deletedUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, operation: 'deleted' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
  }

  // Return a 200 response for other event types
  return NextResponse.json({ success: true, message: 'Webhook received' });
}
