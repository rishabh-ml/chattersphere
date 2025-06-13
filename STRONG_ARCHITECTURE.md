# Strong Architecture Documentation

This document provides a comprehensive overview of the ChatterSphere codebase, detailing every directory and file with their specific purpose and functionality.

---

## Root Directory Structure

### Configuration Files
- **README.md**: Comprehensive project overview, features, setup instructions, and deployment guides
- **ARCHITECTURE.md**: High-level architectural summary and development conventions
- **STRONG_ARCHITECTURE.md**: This detailed documentation of every file and directory
- **API_DOCUMENTATION.md**: Complete API endpoint documentation with request/response schemas
- **CONTRIBUTING.md**: Guidelines for contributing to the project, code standards, and PR requirements
- **package.json**: NPM dependencies, scripts, and project metadata
- **package-lock.json**: Locked dependency versions for consistent installations
- **next.config.js**: Next.js configuration for builds, redirects, and environment variables
- **next.config.js.new**: Backup/alternative Next.js configuration
- **next.config.ts**: TypeScript version of Next.js configuration
- **tsconfig.json**: TypeScript compiler configuration and path mappings
- **tsconfig.build.json**: Build-specific TypeScript configuration
- **tsconfig.tsbuildinfo**: TypeScript incremental compilation cache
- **eslint.config.mjs**: ESLint configuration for code quality and formatting
- **components.json**: Shadcn UI component configuration and styling
- **tailwind.config.js**: Tailwind CSS configuration including custom themes and utilities
- **postcss.config.mjs**: PostCSS configuration for CSS processing
- **jest.config.js**: Jest testing framework configuration
- **jest.setup.js**: Jest test environment setup and global mocks
- **cypress.config.ts**: Cypress end-to-end testing configuration
- **docker-compose.yml**: Multi-container Docker setup for development environment
- **Dockerfile**: Docker image configuration for containerized deployment
- **qodana.yaml**: JetBrains Qodana code quality analysis configuration
- **migration-plan.md**: Database migration strategy and execution plan
- **jsconfig.json**: JavaScript project configuration for VS Code

### Environment & Git Files
- **.env**: Environment variables for production
- **.env.development**: Development-specific environment variables
- **.gitignore**: Git ignore patterns for files/directories to exclude from version control
- **.prettierrc**: Prettier code formatting configuration
- **.prettierignore**: Files/directories to exclude from Prettier formatting
- **.lintstagedrc.js**: Lint-staged configuration for pre-commit hooks
- **.bin**: Binary executables directory
- **.husky/pre-commit**: Git pre-commit hook configuration

### Monitoring & Analytics
- **sentry.client.config.js**: Sentry error tracking configuration for client-side
- **sentry.server.config.js**: Sentry error tracking configuration for server-side  
- **sentry.edge.config.js**: Sentry configuration for Edge Runtime

---

## GitHub Workflows (`.github/workflows/`)
- **ci.yml**: Continuous Integration pipeline for testing and quality checks
- **deploy.yml**: Automated deployment pipeline for production
- **qodana_code_quality.yml**: Code quality analysis workflow

---

## Public Assets (`public/`)

### Core Assets
- **favicon.ico**: Website favicon for browser tabs
- **logo.png**: ChatterSphere main logo image
- **manifest.json**: PWA manifest for mobile app-like behavior
- **apple-touch-icon.png**: iOS home screen icon
- **web-app-manifest-192x192.png**: PWA icon (192x192)
- **web-app-manifest-512x512.png**: PWA icon (512x512)

### Development Tools
- **enable-supabase-mock.js**: Script to enable Supabase storage mocking in development
- **disable-supabase-mock.js**: Script to disable Supabase storage mocking

### Icons & Graphics
- **next.svg**: Next.js logo
- **vercel.svg**: Vercel deployment platform logo
- **file.svg**: Generic file icon
- **globe.svg**: Globe/world icon
- **window.svg**: Window/browser icon
- **google-icon.svg**: Google OAuth login icon
- **conversations-illustration.svg**: Messaging feature illustration

### User Avatars (`public/avatars/`)
- **alex.png**: Sample user avatar
- **ananya.png**: Sample user avatar
- **jasmine.png**: Sample user avatar
- **miguel.png**: Sample user avatar
- **prince.png**: Developer avatar (Prince Dwivedi)
- **rishabh.png**: Developer avatar (Rishabh Shukla)
- **sarah.png**: Sample user avatar
- **aizen-pfp.jpg**: Sample user avatar

---

## Scripts Directory (`scripts/`)

### Database & Setup Scripts
- **setup-supabase.js**: Initialize Supabase storage buckets and configuration
- **test-supabase.js**: Test Supabase connection and functionality
- **create-sample-community.js**: Create sample communities for development/testing
- **migrate-memberships.js**: Migrate community membership data structure
- **migrate-votes.js**: Migrate post/comment voting data structure

---

## Cypress Testing (`cypress/`)

### End-to-End Tests (`cypress/e2e/`)
- **home.cy.ts**: Test cases for home page functionality and user interactions

### Support Files (`cypress/support/`)
- **commands.ts**: Custom Cypress commands and utilities
- **e2e.ts**: Global end-to-end test configuration and setup

---

## Source Code (`src/`)

### Root Source Files
- **middleware.ts**: Next.js middleware for authentication, logging, and request processing
- **types.ts**: Global TypeScript type definitions

---

## App Router (`src/app/`)

### Root App Files
- **layout.tsx**: Root HTML layout with providers, metadata, and global styling
- **page.tsx**: Public landing page with hero section, features, and signup
- **providers.tsx**: React Query, Clerk Auth, and other global providers
- **globals.css**: Global CSS styles and Tailwind base styles
- **error.tsx**: Global error boundary component
- **not-found.tsx**: 404 page component
- **maintenance.tsx**: Maintenance mode page
- **analytics.tsx**: Analytics tracking and web vitals monitoring

### App Metadata
- **favicon.ico**: App-specific favicon
- **icon0.svg**: App icon variant
- **icon1.png**: App icon variant
- **apple-icon.png**: iOS app icon
- **manifest.json**: App-specific PWA manifest

### Authentication Pages
- **sign-in/page.tsx**: User sign-in page with Clerk authentication
- **sign-up/page.tsx**: User registration page with form validation
- **verify/page.tsx**: Email verification page
- **sso-callback/page.tsx**: Single Sign-On callback handler

### Legal & Info Pages
- **about-developers/page.tsx**: Developer team information and project details
- **contact-us/page.tsx**: Contact form and company information
- **privacy-policy/page.tsx**: Privacy policy and data handling information
- **terms-of-service/page.tsx**: Terms of service and user agreements
- **cookie-policy/page.tsx**: Cookie usage policy and preferences

---

## Main Application (`src/app/(main)/`)

### Layout & Error Handling
- **layout.tsx**: Main authenticated layout with sidebar, topbar, and navigation
- **error.tsx**: Error boundary for main application area

### Core Pages
- **home/page.tsx**: User dashboard and main feed
- **home/Feed.tsx**: Main feed component with post display and interactions
- **explore/page.tsx**: Discover new content and communities
- **popular/page.tsx**: Trending posts and popular content
- **saved/page.tsx**: User's saved posts and bookmarks
- **notifications/page.tsx**: User notifications and activity feed
- **settings/page.tsx**: User account and application settings

### Profile Management
- **profile/[userId]/page.tsx**: User profile display with posts and information
- **profile/[userId]/followers/page.tsx**: User's followers list
- **profile/[userId]/following/page.tsx**: Users that the current user follows

### Messaging System
- **messages/layout.tsx**: Messages area layout with sidebar
- **messages/page.tsx**: Messages overview and conversation list
- **messages/new/page.tsx**: Create new message/conversation
- **messages/[userId]/page.tsx**: Individual conversation view

### Community Features
- **communities/[slug]/layout.tsx**: Community-specific layout with channels and members
- **communities/[slug]/page.tsx**: Community overview and main content
- **communities/[slug]/error.tsx**: Community-specific error handling
- **communities/[slug]/channels/[channelId]/page.tsx**: Individual channel view
- **community/[slug]/page.tsx**: Alternative community page structure
- **community/[slug]/CommunityPage.tsx**: Community page component

### Posts & Content
- **posts/[postId]/page.tsx**: Individual post view with comments

### Administration
- **admin/page.tsx**: Admin dashboard with statistics and management tools

---

## API Routes (`src/app/api/`)

### API Tests (`src/app/api/__tests__/`)
- **comments.test.ts**: Comment API endpoint tests
- **comment-deletion.test.ts**: Comment deletion functionality tests
- **communities.test.ts**: Community API endpoint tests
- **community.test.ts**: Individual community tests
- **community-slug.test.ts**: Community slug handling tests
- **community-slug-api.test.ts**: Community slug API tests
- **community-membership.test.ts**: Community membership API tests
- **direct-messages.test.ts**: Direct messaging API tests
- **follow-privacy.test.ts**: Follow system privacy tests
- **membership-approval.test.ts**: Community membership approval tests
- **notifications.test.ts**: Notification system tests
- **post-comments.test.ts**: Post comment integration tests
- **post-deletion.test.ts**: Post deletion functionality tests
- **private-community-access.test.ts**: Private community access control tests
- **user-deletion.test.ts**: User account deletion tests

### User Management (`src/app/api/users/`)
- **route.ts**: User listing and search
- **search/route.ts**: User search functionality
- **[userId]/route.ts**: Individual user operations (get, update, delete)
- **[userId]/follow/route.ts**: Follow user functionality
- **[userId]/unfollow/route.ts**: Unfollow user functionality
- **[userId]/followers/route.ts**: Get user's followers
- **[userId]/following/route.ts**: Get users that user follows
- **[userId]/communities/route.ts**: Get user's communities

### Community Management (`src/app/api/communities/`)
- **route.ts**: Community listing, creation, and management
- **suggested/route.ts**: Suggested communities algorithm
- **my-communities/route.ts**: Current user's communities
- **slug/[slug]/route.ts**: Community lookup by slug
- **[communityId]/route.ts**: Individual community operations
- **[communityId]/posts/route.ts**: Community posts
- **[communityId]/members/route.ts**: Community members management
- **[communityId]/membership/route.ts**: Join/leave community
- **[communityId]/membership/[userId]/route.ts**: Individual membership management
- **[communityId]/membership-requests/route.ts**: Handle membership requests
- **[communityId]/roles/route.ts**: Community role management
- **[communityId]/channels/route.ts**: Community channels
- **[communityId]/channels/[channelId]/route.ts**: Individual channel operations

### Posts & Content (`src/app/api/posts/`)
- **route.ts**: Post creation, listing, and management
- **feed/route.ts**: Main feed algorithm and post delivery
- **feed/mock-route.ts**: Mock feed data for development
- **popular/route.ts**: Popular posts algorithm
- **saved/route.ts**: User's saved posts
- **mock-data.ts**: Mock post data for testing
- **[postId]/route.ts**: Individual post operations
- **[postId]/vote/route.ts**: Post voting (upvote/downvote)
- **[postId]/save/route.ts**: Save/unsave posts
- **[postId]/comments/route.ts**: Post comments

### Comments (`src/app/api/comments/`)
- **[commentId]/route.ts**: Individual comment operations
- **[commentId]/vote/route.ts**: Comment voting

### Profile Management (`src/app/api/profile/`)
- **[userId]/route.ts**: Profile data management
- **[userId]/activity/route.ts**: User activity tracking
- **[userId]/avatar/route.ts**: Profile picture upload/management
- **[userId]/export/route.ts**: User data export functionality
- **[userId]/privacy/route.ts**: Privacy settings management

### Messaging (`src/app/api/messages/`)
- **route.ts**: Message listing and management
- **[userId]/route.ts**: Direct messages with specific user
- **read/[messageId]/route.ts**: Mark messages as read
- **unread/count/route.ts**: Get unread message count

### Notifications (`src/app/api/notifications/`)
- **route.ts**: Notification listing and management
- **read-all/route.ts**: Mark all notifications as read
- **[notificationId]/read/route.ts**: Mark individual notification as read

### Media & Files (`src/app/api/media/`)
- **upload/route.ts**: File upload handling for images and attachments

### Analytics (`src/app/api/analytics/`)
- **vitals/route.ts**: Web vitals and performance metrics
- **profile-view/route.ts**: Profile view tracking

### Admin APIs (`src/app/api/admin/`)
- **cache/route.ts**: Cache management and invalidation
- **performance/route.ts**: Performance monitoring and metrics
- **database/archive/route.ts**: Database archiving operations

### Miscellaneous APIs
- **feed/home/route.ts**: Home feed algorithm
- **newsletter/route.ts**: Newsletter subscription management
- **topics/trending/route.ts**: Trending topics algorithm
- **webhook/clerk/route.ts**: Clerk authentication webhooks

---

## Feature Modules (`src/features/`)

### Authentication Feature (`src/features/auth/`)
#### Components
- **SignInForm.tsx**: User sign-in form with validation and error handling
- **SignUpForm.tsx**: User registration form with email verification
- **SecuritySettings.tsx**: Security preferences, 2FA, and session management

#### Services & Logic
- **services/authService.ts**: Authentication service wrapper around Clerk
- **hooks/useAuthManager.ts**: Authentication state management and actions
- **types/index.ts**: Authentication-related TypeScript interfaces

### Posts Feature (`src/features/posts/`)
#### Components
- **PostCard.tsx**: Individual post display with voting and actions
- **post-feed.tsx**: Feed of posts with infinite scrolling
- **post-editor.tsx**: Rich text editor for creating/editing posts
- **create-post-form.tsx**: Form for creating new posts
- **create-post-modal.tsx**: Modal wrapper for post creation
- **DeletePostButton.tsx**: Post deletion with confirmation

#### State Management
- **contexts/PostContext.tsx**: Global post state management
- **contexts/CreatePostModalContext.tsx**: Post creation modal state
- **contexts/PopularPostContext.tsx**: Popular posts state
- **contexts/SavedPostContext.tsx**: Saved posts state

#### Services & Logic
- **services/postsService.ts**: Post API interactions and business logic
- **hooks/usePosts.ts**: Post data fetching and state management
- **hooks/usePostActions.ts**: Post actions (vote, save, delete)

#### Types
- **types/index.ts**: Post-related TypeScript interfaces
- **types/post.ts**: Detailed post type definitions

### Communities Feature (`src/features/communities/`)
#### Components
- **community-card.tsx**: Community card display in lists
- **community-list.tsx**: List of communities with filtering
- **landing-community-card.tsx**: Community cards for landing page
- **my-communities-list.tsx**: User's joined communities
- **create-community-form.tsx**: Form for creating new communities
- **CommunityHeader.tsx**: Community page header with info and actions
- **CommunityChannelSidebar.tsx**: Channel navigation sidebar
- **CommunityMembersSidebar.tsx**: Members list sidebar
- **CommunityJoinButton.tsx**: Join/leave community button
- **CommunityPostForm.tsx**: Post creation within community

#### State Management
- **contexts/CommunityContext.tsx**: Global community state
- **contexts/SingleCommunityContext.tsx**: Individual community state

#### Services & Logic
- **services/communitiesService.ts**: Community API interactions
- **hooks/useCommunityActions.ts**: Community actions (join, leave, create)
- **types/index.ts**: Community-related TypeScript interfaces

### Messages Feature (`src/features/messages/`)
#### Components
- **ConversationsList.tsx**: List of user's conversations
- **ConversationView.tsx**: Individual conversation interface
- **NewMessage.tsx**: Start new conversation component
- **MessageNotificationBadge.tsx**: Unread message indicator

#### State Management
- **contexts/MessagesContext.tsx**: Messaging state management

#### Services & Logic
- **services/messagesService.ts**: Direct messaging API interactions
- **hooks/useMessages.ts**: Message data fetching and real-time updates
- **types/index.ts**: Message-related TypeScript interfaces

### Notifications Feature (`src/features/notifications/`)
#### Components
- **NotificationsList.tsx**: List of user notifications with actions
- **NotificationBadge.tsx**: Unread notification indicator
- **NotificationPreferencesForm.tsx**: Notification settings management

#### Services & Logic
- **services/notificationsService.ts**: Notification API interactions
- **hooks/useNotifications.ts**: Notification state and real-time updates
- **types/index.ts**: Notification types and enums

### Profiles Feature (`src/features/profiles/`)
#### Components
- **ProfileHeader.tsx**: User profile header with avatar and info
- **ProfileTabs.tsx**: Profile tab navigation (posts, about, activity)
- **ProfileDropdown.tsx**: User profile dropdown menu
- **AboutTab.tsx**: User bio and information tab
- **ActivityTab.tsx**: User activity and statistics tab
- **PrivacyTab.tsx**: Privacy settings tab

#### Services & Logic
- **services/profilesService.ts**: Profile API interactions
- **types/index.ts**: Profile-related TypeScript interfaces

### Settings Feature (`src/features/settings/`)
#### Components
- **SettingsPage.tsx**: Main settings page with tabs and forms
- **DeleteAccountButton.tsx**: Account deletion with confirmation

---

## Shared Resources (`src/shared/`)

### UI Components (`src/shared/ui/`)
- **avatar.tsx**: User avatar component with fallback
- **badge.tsx**: Status badges and labels
- **button.tsx**: Reusable button component with variants
- **card.tsx**: Card container component
- **carousel.tsx**: Image/content carousel component
- **checkbox.jsx**: Checkbox input component
- **dialog.tsx**: Modal dialog component
- **dropdown-menu.tsx**: Dropdown menu component
- **input.tsx**: Text input component with validation
- **label.tsx**: Form label component
- **optimized-image.tsx**: Next.js optimized image wrapper
- **scroll-area.jsx**: Custom scrollable area component
- **select.tsx**: Select dropdown component
- **separator.tsx**: Visual separator component
- **sidebar.tsx**: Sidebar layout component
- **skeleton.tsx**: Loading skeleton component
- **spinner.tsx**: Loading spinner component
- **switch.tsx**: Toggle switch component
- **tabs.tsx**: Tab navigation component
- **textarea.tsx**: Multi-line text input
- **tooltip.tsx**: Hover tooltip component

### Services (`src/shared/services/`)
- **apiClient.ts**: Centralized HTTP client with error handling and authentication

### Providers (`src/shared/providers/`)
- **DataProvider.tsx**: React Query provider for data fetching

### Utilities (`src/shared/utils/`)
- **cn.ts**: Class name utility for conditional CSS classes

---

## Legacy Components (`src/components/`)

### Core Components (To be migrated)
- **header.tsx**: Site header with navigation
- **sidebar.tsx** / **sidebar.jsx**: Main navigation sidebar
- **topbar.tsx**: Top navigation bar
- **right-sidebar.tsx**: Right sidebar with trending content
- **feature-card.tsx**: Feature highlight cards
- **step-card.tsx**: Step-by-step guide cards
- **testimonial-card.tsx**: User testimonial cards
- **error-boundary.tsx**: React error boundary component
- **Logo.tsx**: ChatterSphere logo component
- **Newsletter.tsx**: Newsletter subscription component
- **optimized-image.tsx**: Image optimization wrapper
- **under-development.tsx**: Under development placeholder

### Feed Components
- **home-feed.tsx**: Home page feed component
- **post-feed.tsx**: General post feed
- **popular-post-feed.tsx**: Popular posts feed
- **saved-post-feed.tsx**: Saved posts feed

### Post Components
- **post-card.tsx**: Post display card
- **post-card.test.tsx**: Post card component tests
- **post-editor.tsx**: Post editor component
- **create-post-form.tsx**: Post creation form
- **create-post-modal.tsx**: Post creation modal

### Community Components
- **community-card.tsx**: Community display card
- **community-list.tsx**: List of communities
- **create-community-form.tsx**: Community creation form
- **landing-community-card.tsx**: Landing page community cards
- **my-communities-list.tsx**: User's communities list

### Media & Upload
- **media-uploader.tsx**: File upload component with drag & drop

### User Management
- **ProfileDropdown.tsx**: User profile dropdown menu

### Specialized Features
- **posts/PostCard.tsx**: Enhanced post card
- **posts/post-feed.tsx**: Posts-specific feed
- **posts/DeletePostButton.tsx**: Post deletion component

- **Profile/ProfileHeader.tsx**: Profile page header
- **Profile/ProfileTabs.tsx**: Profile navigation tabs
- **Profile/AboutTab.tsx**: Profile about section
- **Profile/ActivityTab.tsx**: Profile activity section
- **Profile/PrivacyTab.tsx**: Profile privacy settings

- **Community/CommunityHeader.tsx**: Community page header
- **Community/CommunityChannelSidebar.tsx**: Community channels sidebar
- **Community/CommunityMembersSidebar.tsx**: Community members sidebar
- **Community/CommunityJoinButton.tsx**: Community join/leave button
- **Community/CommunityPostForm.tsx**: Community post creation

- **messages/ConversationView.tsx**: Message conversation interface
- **messages/ConversationsList.tsx**: List of conversations
- **messages/NewMessage.tsx**: New message creation
- **messages/MessageNotificationBadge.tsx**: Message notification indicator

- **comments/CommentForm.tsx**: Comment creation form
- **comments/CommentItem.tsx**: Individual comment display
- **comments/CommentList.tsx**: List of comments
- **comments/DeleteCommentButton.tsx**: Comment deletion

- **notifications/NotificationBell.tsx**: Notification bell icon
- **notifications/NotificationList.tsx**: Notification list display

- **settings/DeleteAccountButton.tsx**: Account deletion component

- **skeletons/comment-skeleton.tsx**: Comment loading skeleton
- **skeletons/community-skeleton.tsx**: Community loading skeleton
- **skeletons/post-skeleton.tsx**: Post loading skeleton
- **skeletons/profile-skeleton.tsx**: Profile loading skeleton

### Providers
- **providers/swr-provider.tsx**: SWR data fetching provider
- **providers/toast-provider.tsx**: Toast notification provider

### Layout Components
- **layouts/StandardPageWrapper.tsx**: Standard page layout wrapper

### Tests
- **__tests__/PostCard.test.tsx**: Post card component tests
- **__tests__/ConversationView.test.tsx**: Conversation view tests
- **Community/__tests__/CommunityJoinButton.test.tsx**: Community join button tests

---

## Legacy Contexts (`src/context/`)

### Data Contexts (To be migrated to features)
- **PostContext.tsx**: Global post state management
- **PopularPostContext.tsx**: Popular posts state
- **SavedPostContext.tsx**: Saved posts state
- **HomeFeedContext.tsx**: Home feed state
- **CreatePostModalContext.tsx**: Post creation modal state
- **CommunityContext.tsx**: Global community state
- **SingleCommunityContext.tsx**: Individual community state
- **DirectMessageContext.tsx**: Direct messaging state

---

## Database Models (`src/models/`)

### Core Models
- **User.ts**: User account and profile data schema
- **Post.ts**: Post content and metadata schema
- **Comment.ts**: Comment data and relationships schema
- **Community.ts**: Community information and settings schema
- **Channel.ts**: Community channel schema
- **Membership.ts**: Community membership and roles schema
- **Role.ts**: User roles and permissions schema
- **Vote.ts**: Post and comment voting schema
- **DirectMessage.ts**: Direct message schema
- **Message.ts**: Channel message schema
- **Notification.ts**: User notification schema
- **Newsletter.ts**: Newsletter subscription schema
- **Analytics.ts**: Analytics and tracking data schema

---

## Library & Utilities (`src/lib/`)

### Core Utilities
- **utils.ts**: General utility functions
- **apiUtils.ts**: API helper functions and middleware
- **dbConnect.ts**: MongoDB connection management
- **mongooseUtils.ts**: Mongoose helper functions and utilities

### Navigation
- **navigation.tsx**: Navigation utilities and route helpers
- **navigation.md**: Navigation system documentation

### Authentication & Security
- **security.ts**: Security utilities and validation
- **api-error.ts**: API error handling and standardization

### Database & Performance
- **dbSharding.ts**: Database sharding configuration
- **archiving.ts**: Data archiving utilities
- **changeStreams.ts**: MongoDB change stream handling
- **redis.ts**: Redis caching configuration
- **performanceTesting.ts**: Performance testing utilities

### External Services
- **supabase.ts**: Supabase client configuration
- **supabase-mock.ts**: Supabase mock implementation for development
- **sentry.ts**: Sentry error tracking configuration
- **monitoring.ts**: Application monitoring and logging

### Environment & Configuration
- **env.ts**: Environment variable validation and typing
- **enable-mock.ts**: Development mock enabling utilities

### Data Fetching
- **swr.ts** / **swr.jsx**: SWR configuration and custom hooks

### Testing
- **test-utils.ts**: Testing utilities and helpers

### Analytics & Monitoring
- **webVitals.ts**: Web performance metrics collection

### Validation
- **validations/profile.ts**: Profile data validation schemas

### Tests (`src/lib/__tests__/`)
- **navigation.test.ts**: Navigation utility tests
- **navigationProvider.test.tsx**: Navigation provider tests
- **navigationIntegration.test.tsx**: Navigation integration tests
- **navigationLinks.test.tsx**: Navigation links tests
- **useNavigation.test.tsx**: Navigation hook tests

---

## Hooks (`src/hooks/`)

### Custom Hooks
- **useFetch.ts**: Generic data fetching hook
- **usePostActions.ts**: Post-specific actions hook
- **useCommunityActions.ts**: Community-specific actions hook

---

## Scripts (`src/scripts/`)

### Database Scripts
- **seed-data.ts**: Database seeding with sample data
- **create-indexes.ts**: Database index creation
- **archive-data.ts**: Data archiving automation
- **performance-test.ts**: Database performance testing

---

## Middleware (`src/middleware/`)

### Request Processing
- **requestLogger.ts**: HTTP request logging middleware
- **rateLimit.ts**: API rate limiting middleware
- **caching.ts**: Response caching middleware
- **performanceMonitoring.ts**: Performance monitoring middleware

---

## Types (`src/types/`)

### Type Definitions
- **index.ts**: Global type definitions and interfaces
- **post.ts**: Post-related type definitions

---

## Utilities (`src/utils/`)

### Utility Functions
- **fetchFeedData.ts**: Feed data fetching utilities

---

## Utils Directory (`utils/`)

*Additional utilities directory at project root level*

---

This comprehensive documentation covers every file and directory in the ChatterSphere project, providing clear insight into the codebase organization and each component's specific purpose within the larger application architecture.
