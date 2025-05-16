// src/lib/supabase-mock.ts
// This is a mock implementation of the Supabase client for development
// when the actual Supabase project is not accessible

import { v4 as uuidv4 } from 'uuid';

// In-memory storage for mock data
const mockStorage: Record<string, Record<string, Buffer>> = {
  avatars: {},
  media: {}
};

// Mock Supabase client
export const supabase = {
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File | Buffer): Promise<{ data: { path: string } | null, error: Error | null }> => {
        try {
          // Create bucket if it doesn't exist
          if (!mockStorage[bucket]) {
            mockStorage[bucket] = {};
          }

          // Convert File to Buffer if needed
          let buffer: Buffer;
          if (file instanceof File) {
            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
          } else {
            buffer = file;
          }

          // Store the file
          mockStorage[bucket][path] = buffer;

          return {
            data: { path },
            error: null
          };
        } catch (error) {
          console.error(`[Mock Supabase] Error uploading to ${bucket}/${path}:`, error);
          return {
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error')
          };
        }
      },

      remove: async (paths: string[]): Promise<{ data: { path: string }[] | null, error: Error | null }> => {
        try {
          if (!mockStorage[bucket]) {
            return { data: [], error: null };
          }

          const removed = [];
          for (const path of paths) {
            if (mockStorage[bucket][path]) {
              delete mockStorage[bucket][path];
              removed.push({ path });
            }
          }

          return {
            data: removed,
            error: null
          };
        } catch (error) {
          console.error(`[Mock Supabase] Error removing from ${bucket}:`, error);
          return {
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error')
          };
        }
      },

      getPublicUrl: (path: string) => ({
        data: {
          publicUrl: `http://localhost:3000/mock-storage/${bucket}/${path}`
        }
      }),

      list: async (prefix: string = '') => {
        try {
          if (!mockStorage[bucket]) {
            return { data: [], error: null };
          }

          const files = Object.keys(mockStorage[bucket])
            .filter(path => path.startsWith(prefix))
            .map(name => ({ name }));

          return {
            data: files,
            error: null
          };
        } catch (error) {
          console.error(`[Mock Supabase] Error listing ${bucket}/${prefix}:`, error);
          return {
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error')
          };
        }
      },

      createSignedUrl: async (path: string, expiresIn: number) => ({
        data: {
          signedUrl: `http://localhost:3000/mock-storage/${bucket}/${path}?token=${uuidv4()}&expires=${Date.now() + expiresIn * 1000}`
        },
        error: null
      })
    }),

    getBucket: async (name: string) => {
      if (mockStorage[name]) {
        return {
          data: { name },
          error: null
        };
      } else {
        return {
          data: null,
          error: { message: 'The resource was not found' }
        };
      }
    },

    createBucket: async (name: string, options: Record<string, unknown> = {}) => {
      mockStorage[name] = {};
      return {
        data: { name },
        error: null
      };
    }
  }
};

// Mock Supabase admin client with service role
export const supabaseAdmin = supabase;

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
    console.log(`[Mock Supabase] Uploading file to ${bucket}/${path}`);

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}_${uuidv4()}.${fileExt}`;

    // Upload the file
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      console.error('[Mock Supabase] Error uploading file:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log(`[Mock Supabase] File uploaded successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[Mock Supabase] Error in uploadFile:', error);
    return null;
  }
}

/**
 * Deletes a file from Supabase Storage
 * @param url URL of the file to delete
 * @returns true if deletion was successful, false otherwise
 */
export async function deleteFile(url: string): Promise<boolean> {
  try {
    console.log(`[Mock Supabase] Deleting file: ${url}`);

    // Extract the path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucket = pathParts[2]; // 'avatars' or 'media' after 'mock-storage'
    const path = pathParts.slice(3).join('/');

    // Delete the file
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

    if (error) {
      console.error('[Mock Supabase] Error deleting file:', error);
      return false;
    }

    console.log(`[Mock Supabase] File deleted successfully: ${url}`);
    return true;
  } catch (error) {
    console.error('[Mock Supabase] Error in deleteFile:', error);
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
    console.log(`[Mock Supabase] Uploading file from URL: ${url}`);

    // Generate a mock URL instead of actually fetching
    const fileExt = url.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${path}/${Date.now()}_${uuidv4()}.${fileExt}`;

    // Create a mock file
    const mockBuffer = Buffer.from('Mock file content');

    // Upload the file
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, mockBuffer);

    if (error) {
      console.error('[Mock Supabase] Error uploading file from URL:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log(`[Mock Supabase] File uploaded successfully from URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[Mock Supabase] Error in uploadFileFromUrl:', error);
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
    console.log(`[Mock Supabase] Generating signed URL for ${bucket}/${path}`);

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('[Mock Supabase] Error generating signed URL:', error);
      return null;
    }

    console.log(`[Mock Supabase] Signed URL generated: ${data.signedUrl}`);
    return data.signedUrl;
  } catch (error) {
    console.error('[Mock Supabase] Error in getSignedUrl:', error);
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
    console.log(`[Mock Supabase] Listing files in ${bucket}${path ? `/${path}` : ''}`);

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(path || '');

    if (error) {
      console.error('[Mock Supabase] Error listing files:', error);
      return null;
    }

    const files = data.map(file => ({
      name: file.name,
      url: supabaseAdmin.storage.from(bucket).getPublicUrl(path ? `${path}/${file.name}` : file.name).data.publicUrl
    }));

    console.log(`[Mock Supabase] Listed ${files.length} files`);
    return files;
  } catch (error) {
    console.error('[Mock Supabase] Error in listFiles:', error);
    return null;
  }
}
