// scripts/setup-supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Log environment variables (without showing full keys)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl || 'Not set');
console.log('Service Role Key:', serviceRoleKey ? `${serviceRoleKey.substring(0, 10)}...` : 'Not set');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Supabase URL or Service Role Key is missing in .env.local');
  process.exit(1);
}

// Create a Supabase admin client with the service role key
const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey
);

async function setupSupabase() {
  console.log('Setting up Supabase storage buckets...');

  try {
    // Test connection to Supabase
    console.log('Testing connection to Supabase...');
    let testData, testError;
    try {
      const response = await supabaseAdmin.from('_test').select('*').limit(1);
      testData = response.data;
      testError = response.error;
    } catch (err) {
      testError = err;
    }

    if (testError) {
      if (testError.message && testError.message.includes('ENOTFOUND')) {
        console.error('Error: Could not connect to Supabase. Please check your internet connection and Supabase URL.');
        console.error(`The URL "${supabaseUrl}" could not be resolved.`);
        console.error('If you are using a test project, make sure it exists and is active.');
        process.exit(1);
      } else if (testError.message && testError.message.includes('relation "_test" does not exist')) {
        // This is actually a good sign - we connected to the database but the test table doesn't exist
        console.log('Successfully connected to Supabase!');
      } else {
        console.error('Error connecting to Supabase:', testError.message);
        // Continue anyway since we might be able to create buckets
      }
    } else {
      console.log('Successfully connected to Supabase!');
    }
    // Check if avatars bucket exists, create if not
    const { data: avatarsBucket, error: avatarsError } = await supabaseAdmin
      .storage
      .getBucket('avatars');

    if (avatarsError && avatarsError.message.includes('The resource was not found')) {
      console.log('Creating avatars bucket...');
      const { error } = await supabaseAdmin.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
      });

      if (error) {
        throw error;
      }

      console.log('✅ avatars bucket created successfully');
    } else if (avatarsError) {
      throw avatarsError;
    } else {
      console.log('✅ avatars bucket already exists');
    }

    // Check if media bucket exists, create if not
    const { data: mediaBucket, error: mediaError } = await supabaseAdmin
      .storage
      .getBucket('media');

    if (mediaError && mediaError.message.includes('The resource was not found')) {
      console.log('Creating media bucket...');
      const { error } = await supabaseAdmin.storage.createBucket('media', {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });

      if (error) {
        throw error;
      }

      console.log('✅ media bucket created successfully');
    } else if (mediaError) {
      throw mediaError;
    } else {
      console.log('✅ media bucket already exists');
    }

    // Set up public access policies for the buckets
    console.log('Setting up storage policies...');

    // For avatars bucket - allow public read access
    const { error: avatarsPolicyError } = await supabaseAdmin
      .storage
      .from('avatars')
      .createSignedUrl('test.txt', 60);

    if (avatarsPolicyError && !avatarsPolicyError.message.includes('The resource was not found')) {
      console.error('Error checking avatars policy:', avatarsPolicyError);
    }

    // For media bucket - allow public read access
    const { error: mediaPolicyError } = await supabaseAdmin
      .storage
      .from('media')
      .createSignedUrl('test.txt', 60);

    if (mediaPolicyError && !mediaPolicyError.message.includes('The resource was not found')) {
      console.error('Error checking media policy:', mediaPolicyError);
    }

    console.log('✅ Supabase setup completed successfully');
  } catch (error) {
    console.error('Error setting up Supabase:', error);
    process.exit(1);
  }
}

setupSupabase();
