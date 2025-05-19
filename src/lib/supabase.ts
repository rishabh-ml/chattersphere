import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { v4 as uuidv4 } from 'uuid';

// Determine if we should use the mock implementation
// Always use mock implementation by default in development since the Supabase instance is not accessible
const USE_MOCK = process.env.NODE_ENV === 'development' &&
  (typeof window !== 'undefined' ? localStorage.getItem('USE_SUPABASE_MOCK') !== 'false' : true);

// Function to check if Supabase is available
const checkSupabaseAvailability = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return true; // Always assume available in SSR

  try {
    const response = await fetch(env.NEXT_PUBLIC_SUPABASE_URL, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store'
    });
    return true;
  } catch (error) {
    console.warn('Supabase connection not available, using mock implementation');
    return false;
  }
};

// If we're using the mock, log a warning
if (USE_MOCK) {
  console.warn('Using mock Supabase implementation. Set localStorage.USE_SUPABASE_MOCK = false to use real Supabase.');
}

// Import the mock implementation dynamically
import * as mockModule from './supabase-mock';

// Create clients based on whether we're using the mock or real implementation
let supabaseClient;
let supabaseAdmin;

if (USE_MOCK) {
  // Use the mock implementation
  supabaseClient = mockModule.supabase;
  supabaseAdmin = mockModule.supabaseAdmin;
} else {
  // Create a Supabase client with the public anon key for client-side usage
  supabaseClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Create a Supabase admin client with the service role key for server-side usage
  // This should ONLY be used in server-side code (API routes)
  supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Export the clients
export { supabaseClient, supabaseAdmin };

/**
 * Uploads a file to Supabase Storage
 * @param file File to upload
 * @param bucket Bucket name ('avatars' or 'media')
 * @param path Path within the bucket
 * @returns URL of the uploaded file or null if upload failed
 */
export async function uploadFile(
  file: File,
  bucket: 'avatars' | 'media',
  path: string
): Promise<string | null> {
  try {
    if (USE_MOCK) {
      // Use the mock implementation
      return await mockModule.uploadFile(file, bucket, path);
    }

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}_${uuidv4()}.${fileExt}`;

    // Upload the file
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return null;
  }
}

/**
 * Deletes a file from Supabase Storage
 * @param url Full URL of the file to delete
 * @returns true if deletion was successful, false otherwise
 */
export async function deleteFile(url: string): Promise<boolean> {
  try {
    if (USE_MOCK) {
      // Use the mock implementation
      return await mockModule.deleteFile(url);
    }

    // Extract the path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucket = pathParts[1]; // 'avatars' or 'media'
    const path = pathParts.slice(2).join('/');

    // Delete the file
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFile:', error);
    return false;
  }
}

/**
 * Uploads a file from a URL to Supabase Storage
 * @param url URL of the file to upload
 * @param bucket Bucket name ('avatars' or 'media')
 * @param path Path within the bucket
 * @returns URL of the uploaded file or null if upload failed
 */
export async function uploadFileFromUrl(
  url: string,
  bucket: 'avatars' | 'media',
  path: string
): Promise<string | null> {
  try {
    if (USE_MOCK) {
      // Use the mock implementation
      return await mockModule.uploadFileFromUrl(url, bucket, path);
    }

    // Fetch the file from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
    }

    const blob = await response.blob();
    const fileExt = url.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${path}/${Date.now()}_${uuidv4()}.${fileExt}`;

    // Upload the file
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file from URL:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadFileFromUrl:', error);
    return null;
  }
}

/**
 * Generates a signed URL for a file in Supabase Storage
 * @param bucket Bucket name ('avatars' or 'media')
 * @param path Path within the bucket
 * @param expiresIn Expiration time in seconds (default: 60)
 * @returns Signed URL or null if generation failed
 */
export async function getSignedUrl(
  bucket: 'avatars' | 'media',
  path: string,
  expiresIn: number = 60
): Promise<string | null> {
  try {
    if (USE_MOCK) {
      // Use the mock implementation
      return await mockModule.getSignedUrl(bucket, path, expiresIn);
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    return null;
  }
}

/**
 * Lists all files in a bucket or folder
 * @param bucket Bucket name ('avatars' or 'media')
 * @param path Path within the bucket (optional)
 * @returns Array of file objects or null if listing failed
 */
export async function listFiles(
  bucket: 'avatars' | 'media',
  path?: string
): Promise<Array<{ name: string, url: string }> | null> {
  try {
    if (USE_MOCK) {
      // Use the mock implementation
      return await mockModule.listFiles(bucket, path);
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(path || '');

    if (error) {
      console.error('Error listing files:', error);
      return null;
    }

    return data.map(file => ({
      name: file.name,
      url: supabaseAdmin.storage.from(bucket).getPublicUrl(path ? `${path}/${file.name}` : file.name).data.publicUrl
    }));
  } catch (error) {
    console.error('Error in listFiles:', error);
    return null;
  }
}
