# ChatterSphere

ChatterSphere is a social media platform that combines the best features of Reddit-style feeds with Discord-inspired real-time channels. This project is built with Next.js, TypeScript, MongoDB, and Clerk Authentication.

## Getting Started

### Prerequisites

- Node.js 18.x or later
- MongoDB database (or MongoDB Atlas account)
- Clerk account for authentication
- Supabase account for storage

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Node Environment
NODE_ENV=development

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase Setup

Run the following command to set up Supabase storage buckets:

```bash
npm run setup-supabase
```

If you encounter issues connecting to Supabase, the application will automatically use a mock implementation in development mode. To enable the mock implementation, open your browser console and run:

```javascript
localStorage.setItem('USE_SUPABASE_MOCK', 'true');
```

Or simply include this script tag in your HTML:

```html
<script src="/enable-supabase-mock.js"></script>
```

### Starting the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Features

### Supabase Storage Integration

ChatterSphere uses Supabase Storage for file uploads and media management. The integration includes:

- Two storage buckets: `avatars` for profile pictures and `media` for post attachments
- Secure file uploads with proper validation and error handling
- Media display in posts with support for multiple images
- Mock implementation for development when Supabase is not available

#### Key Components

- **MediaUploader**: Reusable component for uploading media files
- **Supabase Client**: Utility functions for interacting with Supabase Storage
- **Media API**: API routes for handling media uploads

### User Profile

The User Profile feature allows users to establish their identity, manage their personal information, control privacy settings, and track their platform activity.

#### Key Components

- **ProfileHeader**: Displays user avatar, name, username, join date, and follow button.
- **ProfileTabs**: Contains tabs for About, Activity, and Privacy settings.
- **AboutTab**: Shows and allows editing of user bio, pronouns, location, website, interests, and social links.
- **ActivityTab**: Displays user's posts and comments with pagination.
- **PrivacyTab**: Allows users to control privacy settings and export their data (GDPR compliance).

#### API Endpoints

- `GET /api/profile/[userId]`: Fetch user profile data
- `PUT /api/profile/[userId]`: Update user profile
- `PUT /api/profile/[userId]/avatar`: Update user avatar
- `GET /api/profile/[userId]/activity`: Fetch user activity (posts and comments)
- `GET /api/profile/[userId]/privacy`: Get user privacy settings
- `PUT /api/profile/[userId]/privacy`: Update user privacy settings
- `POST /api/profile/[userId]/export`: Request data export (GDPR compliance)

#### Technologies Used

- **Supabase Storage**: For avatar uploads and management
- **MongoDB**: For storing user profile data
- **Clerk Authentication**: For user authentication and identity management
- **Zod**: For data validation
- **Tailwind CSS + Radix UI**: For styling and UI components

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Clerk Documentation](https://clerk.dev/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)

## Deployment

The application can be deployed on various platforms:

- [Vercel](https://vercel.com/) (recommended for Next.js applications)
- [Netlify](https://www.netlify.com/)
- [AWS Amplify](https://aws.amazon.com/amplify/)

Make sure to set up the required environment variables for each service (MongoDB, Clerk, Supabase) in your deployment environment.
