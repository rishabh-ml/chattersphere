# ChatterSphere

[![CI](https://github.com/rishabh-ml/chattersphere/actions/workflows/ci.yml/badge.svg)](https://github.com/rishabh-ml/chattersphere/actions/workflows/ci.yml)
[![Deploy](https://github.com/rishabh-ml/chattersphere/actions/workflows/deploy.yml/badge.svg)](https://github.com/rishabh-ml/chattersphere/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/rishabh-ml/chattersphere/branch/main/graph/badge.svg)](https://codecov.io/gh/rishabh-ml/chattersphere)

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

### Direct Messaging System

ChatterSphere includes a comprehensive direct messaging system that allows users to communicate privately. The system includes:

- Real-time conversation list with unread message indicators
- Private messaging between users with privacy controls
- Support for text messages and attachments
- Message read status tracking
- User search functionality
- Responsive UI for desktop and mobile

#### Key Components

- **ConversationsList**: Displays all conversations with unread indicators
- **ConversationView**: Shows the message thread with a specific user
- **NewMessage**: Interface for starting a new conversation
- **MessageNotificationBadge**: Shows unread message count in the UI

#### API Endpoints

- `GET /api/messages`: Fetch user conversations
- `GET /api/messages/[userId]`: Fetch messages with a specific user
- `POST /api/messages/[userId]`: Send a message to a user
- `PUT /api/messages/[messageId]/read`: Mark a message as read
- `GET /api/users/search`: Search for users to message

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

### Content Management and Deletion

ChatterSphere provides comprehensive content management capabilities, including secure deletion of user-generated content:

- Post deletion with cascade deletion of associated comments
- Comment deletion with proper authorization checks
- User account deletion with comprehensive data cleanup
- Role-based permissions for content moderation
- Confirmation dialogs to prevent accidental deletions

#### Key Components

- **DeletePostButton**: UI component for deleting posts with confirmation
- **DeleteCommentButton**: UI component for deleting comments with confirmation
- **DeleteAccountButton**: UI component for account deletion with verification

#### API Endpoints

- `DELETE /api/posts/[postId]`: Delete a post and its associated comments
- `DELETE /api/comments/[commentId]`: Delete a comment
- `DELETE /api/users/[userId]`: Delete a user account and all associated data

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

## Testing

ChatterSphere has comprehensive test coverage for both frontend and backend components.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch

# Run end-to-end tests with Cypress
npm run cypress

# Run end-to-end tests in headless mode
npm run cypress:headless
```

### Test Structure

- **Unit Tests**: Located in `__tests__` directories alongside the code they test
- **API Tests**: Located in `src/app/api/__tests__`
  - `direct-messages.test.ts`: Tests for the direct messaging API
  - `user-deletion.test.ts`: Tests for user account deletion
  - `post-deletion.test.ts`: Tests for post deletion
  - `comment-deletion.test.ts`: Tests for comment deletion
- **Component Tests**: Located in `src/components/__tests__`
  - `ConversationView.test.tsx`: Tests for the conversation view component
  - `DeletePostButton.test.tsx`: Tests for the post deletion component
  - `DeleteCommentButton.test.tsx`: Tests for the comment deletion component
- **E2E Tests**: Located in `cypress/e2e`

## Database Setup and Seed Data

To set up your database with initial seed data, run:

```bash
# Create database indexes
npm run db:indexes

# Seed the database with test data
npm run db:seed
```

The seed script creates:
- Sample users with different roles
- Communities with various privacy settings
- Posts and comments
- Memberships with different roles

## Deployment

The application can be deployed on various platforms:

- [Vercel](https://vercel.com/) (recommended for Next.js applications)
- [Netlify](https://www.netlify.com/)
- [AWS Amplify](https://aws.amazon.com/amplify/)

### Deployment Steps

1. Set up environment variables in your deployment platform
2. Connect your GitHub repository to your deployment platform
3. Configure build settings (Node.js version, build command, etc.)
4. Deploy the application

Make sure to set up the required environment variables for each service (MongoDB, Clerk, Supabase) in your deployment environment.

### Docker Deployment

You can also deploy using Docker:

```bash
# Build the Docker image
docker build -t chattersphere .

# Run the Docker container
docker run -p 3000:3000 --env-file .env.local chattersphere
```

Alternatively, use Docker Compose:

```bash
docker-compose up -d
```
