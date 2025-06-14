# Services API Documentation

This document provides comprehensive documentation for all service layer APIs in the ChatterSphere application.

## Overview

The service layer provides a clean abstraction between the API routes and the database models. Each feature has its own service module that handles business logic, data validation, and database operations.

## Service Architecture

```
src/features/[feature]/services/
├── index.ts          # Main service exports
├── [feature]Service.ts # Core service implementation
└── __tests__/        # Service unit tests
```

## Core Services

### Authentication & Profiles (`src/features/profiles/services/`)

#### `userService.ts`

Handles user profile management and authentication-related operations.

##### Functions

###### `createUserProfile(userData: CreateUserData): Promise<User>`

Creates a new user profile in the database.

**Parameters:**
- `userData`: Object containing user information
  - `clerkId`: string - Clerk authentication ID
  - `username`: string - Unique username
  - `name`: string - Display name
  - `email`: string - Email address
  - `image?`: string - Profile image URL

**Returns:** Promise resolving to the created user object

**Throws:** Database errors, validation errors

**Example:**
```typescript
const user = await createUserProfile({
  clerkId: "user_123",
  username: "johndoe",
  name: "John Doe",
  email: "john@example.com"
});
```

###### `getUserProfile(clerkId: string): Promise<User | null>`

Retrieves a user profile by Clerk ID.

**Parameters:**
- `clerkId`: string - Clerk authentication ID

**Returns:** Promise resolving to user object or null if not found

**Example:**
```typescript
const user = await getUserProfile("user_123");
if (user) {
  console.log(user.username);
}
```

###### `updateUserProfile(userId: string, updateData: UpdateUserData): Promise<User | null>`

Updates an existing user profile.

**Parameters:**
- `userId`: string - MongoDB user ID
- `updateData`: Object with fields to update
  - `bio?`: string - User biography
  - `location?`: string - User location
  - `website?`: string - User website URL
  - `pronouns?`: string - User pronouns
  - `interests?`: string[] - User interests
  - `socialLinks?`: SocialLink[] - Social media links

**Returns:** Promise resolving to updated user object

**Example:**
```typescript
const updatedUser = await updateUserProfile(userId, {
  bio: "Software developer passionate about React",
  location: "San Francisco, CA"
});
```

###### `searchUsers(query: string, limit?: number): Promise<User[]>`

Searches for users by username or name.

**Parameters:**
- `query`: string - Search query
- `limit?`: number - Maximum results to return (default: 10)

**Returns:** Promise resolving to array of matching users

###### `followUser(followerId: string, followeeId: string): Promise<void>`

Creates a follow relationship between two users.

**Parameters:**
- `followerId`: string - ID of user doing the following
- `followeeId`: string - ID of user being followed

**Error Handling:** Throws error if users don't exist or relationship already exists

###### `unfollowUser(followerId: string, followeeId: string): Promise<void>`

Removes a follow relationship between two users.

**Parameters:**
- `followerId`: string - ID of user doing the unfollowing
- `followeeId`: string - ID of user being unfollowed

### Communities (`src/features/communities/services/`)

#### `communityService.ts`

Manages community operations including creation, membership, and content.

##### Functions

###### `createCommunity(data: CreateCommunityData): Promise<Community>`

Creates a new community.

**Parameters:**
- `data`: Object containing community information
  - `name`: string - Community name
  - `slug`: string - URL-safe identifier
  - `description`: string - Community description
  - `creatorId`: string - User ID of community creator
  - `isPrivate?`: boolean - Whether community is private

**Returns:** Promise resolving to created community

###### `getCommunityBySlug(slug: string): Promise<Community | null>`

Retrieves a community by its slug.

**Parameters:**
- `slug`: string - Community slug

**Returns:** Promise resolving to community object or null

###### `joinCommunity(userId: string, communityId: string): Promise<void>`

Adds a user to a community.

**Parameters:**
- `userId`: string - User ID
- `communityId`: string - Community ID

**Error Handling:** Throws error if user already member or community doesn't exist

###### `leaveCommunity(userId: string, communityId: string): Promise<void>`

Removes a user from a community.

**Parameters:**
- `userId`: string - User ID
- `communityId`: string - Community ID

### Posts (`src/features/posts/services/`)

#### `postService.ts`

Handles post creation, retrieval, and management.

##### Functions

###### `createPost(data: CreatePostData): Promise<Post>`

Creates a new post.

**Parameters:**
- `data`: Object containing post information
  - `content`: string - Post content
  - `authorId`: string - Author user ID
  - `communityId?`: string - Community ID (optional)
  - `mediaUrls?`: string[] - Media attachments

**Returns:** Promise resolving to created post with populated author

###### `getPostById(postId: string): Promise<Post | null>`

Retrieves a post by ID with populated relationships.

**Parameters:**
- `postId`: string - Post ID

**Returns:** Promise resolving to post object or null

###### `voteOnPost(postId: string, userId: string, voteType: 'upvote' | 'downvote'): Promise<void>`

Records a vote on a post.

**Parameters:**
- `postId`: string - Post ID
- `userId`: string - Voting user ID
- `voteType`: 'upvote' | 'downvote' - Type of vote

**Error Handling:** Handles vote changes and removes existing opposite votes

### Messaging (`src/features/messaging/services/`)

#### `messageService.ts`

Manages direct messages between users.

##### Functions

###### `sendMessage(senderId: string, recipientId: string, content: string): Promise<Message>`

Sends a direct message.

**Parameters:**
- `senderId`: string - Sender user ID
- `recipientId`: string - Recipient user ID
- `content`: string - Message content

**Returns:** Promise resolving to created message

###### `getConversation(userId1: string, userId2: string, page?: number): Promise<Message[]>`

Retrieves messages between two users.

**Parameters:**
- `userId1`: string - First user ID
- `userId2`: string - Second user ID
- `page?`: number - Page number for pagination

**Returns:** Promise resolving to array of messages

###### `markMessageAsRead(messageId: string, userId: string): Promise<void>`

Marks a message as read.

**Parameters:**
- `messageId`: string - Message ID
- `userId`: string - User ID (must be recipient)

### Notifications (`src/features/notifications/services/`)

#### `notificationService.ts`

Manages user notifications.

##### Functions

###### `createNotification(data: CreateNotificationData): Promise<Notification>`

Creates a new notification.

**Parameters:**
- `data`: Object containing notification information
  - `type`: string - Notification type
  - `message`: string - Notification message
  - `recipientId`: string - Recipient user ID
  - `senderId?`: string - Sender user ID
  - `relatedPostId?`: string - Related post ID
  - `relatedCommentId?`: string - Related comment ID

**Returns:** Promise resolving to created notification

###### `getUserNotifications(userId: string, options?: NotificationOptions): Promise<Notification[]>`

Retrieves notifications for a user.

**Parameters:**
- `userId`: string - User ID
- `options?`: Object with optional filters
  - `unreadOnly?`: boolean - Only unread notifications
  - `page?`: number - Page number
  - `limit?`: number - Results per page

**Returns:** Promise resolving to array of notifications

###### `markNotificationAsRead(notificationId: string, userId: string): Promise<void>`

Marks a notification as read.

**Parameters:**
- `notificationId`: string - Notification ID
- `userId`: string - User ID (must be recipient)

## Error Handling

All services follow consistent error handling patterns:

1. **Validation Errors**: Thrown when input data is invalid
2. **Not Found Errors**: Thrown when requested resources don't exist
3. **Permission Errors**: Thrown when user lacks required permissions
4. **Database Errors**: Thrown when database operations fail

## Usage Examples

### Creating a Complete User Flow

```typescript
// 1. Create user profile
const user = await createUserProfile({
  clerkId: "user_123",
  username: "johndoe",
  name: "John Doe",
  email: "john@example.com"
});

// 2. Create a community
const community = await createCommunity({
  name: "React Developers",
  slug: "react-developers",
  description: "A community for React developers",
  creatorId: user._id
});

// 3. Create a post
const post = await createPost({
  content: "Welcome to our React community!",
  authorId: user._id,
  communityId: community._id
});

// 4. Send a notification
await createNotification({
  type: "new_post",
  message: "New post in React Developers",
  recipientId: "other_user_id",
  senderId: user._id,
  relatedPostId: post._id
});
```

## Testing

All services include comprehensive unit tests located in `__tests__` directories. Tests cover:

- Happy path scenarios
- Error conditions
- Edge cases
- Input validation
- Database interaction mocking

## Performance Considerations

Services are optimized for performance through:

- Database query optimization
- Proper indexing
- Connection pooling
- Caching strategies (where applicable)
- Pagination for large datasets

## Security

Services implement security best practices:

- Input sanitization
- SQL injection prevention
- Access control validation
- Rate limiting (handled at API layer)
- Data encryption for sensitive information
