import { z } from 'zod';

// Validation schema for social links
export const socialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform name is required'),
  url: z.string().url('Please enter a valid URL'),
});

// Validation schema for privacy settings
export const privacySettingsSchema = z.object({
  showEmail: z.boolean().default(false),
  showActivity: z.boolean().default(true),
  allowFollowers: z.boolean().default(true),
  allowMessages: z.boolean().default(true),
});

// Validation schema for profile update
export const profileUpdateSchema = z.object({
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional().nullable(),
  pronouns: z.string().max(30, 'Pronouns must be 30 characters or less').optional().nullable(),
  location: z.string().max(100, 'Location must be 100 characters or less').optional().nullable(),
  website: z.string().url('Please enter a valid URL').max(100, 'Website URL must be 100 characters or less').optional().nullable(),
  socialLinks: z.array(socialLinkSchema).max(5, 'You can add up to 5 social links').optional(),
  interests: z.array(z.string().max(30, 'Each interest must be 30 characters or less')).max(10, 'You can add up to 10 interests').optional(),
});

// Validation schema for avatar upload
export const avatarUploadSchema = z.object({
  image: z.instanceof(File, { message: 'Please upload a valid image file' })
    .refine(file => file.size <= 5 * 1024 * 1024, 'Image must be 5MB or less')
    .refine(
      file => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'Supported formats: JPEG, PNG, WEBP, GIF'
    ),
});

// Validation schema for privacy settings update
export const privacyUpdateSchema = z.object({
  privacySettings: privacySettingsSchema,
});

// Type definitions based on the schemas
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;
export type PrivacyUpdateInput = z.infer<typeof privacyUpdateSchema>;
