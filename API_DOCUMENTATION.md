# ChatterSphere API Documentation

This document provides comprehensive documentation for the ChatterSphere API.

## Authentication

All API endpoints require authentication using Clerk. The authentication is handled automatically when using the API from the frontend.

## Base URL

The base URL for all API endpoints is `/api`.

## Error Handling

All API endpoints return appropriate HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses have the following format:

```json
{
  "error": "Error message"
}
```

## Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Number of items per page (default varies by endpoint)

Paginated responses have the following format:

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10,
    "hasMore": true
  }
}
```

## API Endpoints

### Posts

#### Get Posts

```
GET /api/posts
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10)
- `communityId`: Filter by community ID
- `userId`: Filter by user ID
- `saved`: Set to `true` to get saved posts

Response:

```json
{
  "posts": [
    {
      "id": "post-id",
      "content": "Post content",
      "author": {
        "id": "user-id",
        "username": "username",
        "name": "User Name",
        "image": "image-url"
      },
      "community": {
        "id": "community-id",
        "name": "Community Name",
        "slug": "community-slug"
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "upvoteCount": 10,
      "downvoteCount": 2,
      "commentCount": 5,
      "isUpvoted": true,
      "isDownvoted": false,
      "isSaved": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPosts": 100,
    "hasMore": true
  }
}
```

#### Get Post by ID

```
GET /api/posts/:postId
```

Response:

```json
{
  "post": {
    "id": "post-id",
    "content": "Post content",
    "author": {
      "id": "user-id",
      "username": "username",
      "name": "User Name",
      "image": "image-url"
    },
    "community": {
      "id": "community-id",
      "name": "Community Name",
      "slug": "community-slug"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "upvoteCount": 10,
    "downvoteCount": 2,
    "commentCount": 5,
    "isUpvoted": true,
    "isDownvoted": false,
    "isSaved": false
  }
}
```

#### Create Post

```
POST /api/posts
```

Request body:

```json
{
  "content": "Post content",
  "communityId": "community-id"
}
```

Response:

```json
{
  "post": {
    "id": "post-id",
    "content": "Post content",
    "author": {
      "id": "user-id",
      "username": "username",
      "name": "User Name",
      "image": "image-url"
    },
    "community": {
      "id": "community-id",
      "name": "Community Name",
      "slug": "community-slug"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "upvoteCount": 0,
    "downvoteCount": 0,
    "commentCount": 0,
    "isUpvoted": false,
    "isDownvoted": false,
    "isSaved": false
  }
}
```

#### Update Post

```
PATCH /api/posts/:postId
```

Request body:

```json
{
  "content": "Updated post content"
}
```

Response:

```json
{
  "post": {
    "id": "post-id",
    "content": "Updated post content",
    "author": {
      "id": "user-id",
      "username": "username",
      "name": "User Name",
      "image": "image-url"
    },
    "community": {
      "id": "community-id",
      "name": "Community Name",
      "slug": "community-slug"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "upvoteCount": 10,
    "downvoteCount": 2,
    "commentCount": 5,
    "isUpvoted": true,
    "isDownvoted": false,
    "isSaved": false
  }
}
```

#### Delete Post

```
DELETE /api/posts/:postId
```

Response:

```json
{
  "success": true
}
```

#### Vote on Post

```
POST /api/posts/:postId/vote
```

Request body:

```json
{
  "type": "upvote" // or "downvote"
}
```

Response:

```json
{
  "success": true,
  "upvoteCount": 11,
  "downvoteCount": 2,
  "isUpvoted": true,
  "isDownvoted": false
}
```

#### Save Post

```
POST /api/posts/:postId/save
```

Response:

```json
{
  "success": true,
  "isSaved": true
}
```

### Comments

#### Get Comments for Post

```
GET /api/posts/:postId/comments
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20)

Response:

```json
{
  "comments": [
    {
      "id": "comment-id",
      "content": "Comment content",
      "author": {
        "id": "user-id",
        "username": "username",
        "name": "User Name",
        "image": "image-url"
      },
      "post": "post-id",
      "parent": null,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "upvoteCount": 5,
      "downvoteCount": 1,
      "isUpvoted": true,
      "isDownvoted": false,
      "replies": [
        {
          "id": "reply-id",
          "content": "Reply content",
          "author": {
            "id": "user-id",
            "username": "username",
            "name": "User Name",
            "image": "image-url"
          },
          "post": "post-id",
          "parent": "comment-id",
          "createdAt": "2023-01-01T00:00:00.000Z",
          "updatedAt": "2023-01-01T00:00:00.000Z",
          "upvoteCount": 2,
          "downvoteCount": 0,
          "isUpvoted": false,
          "isDownvoted": false
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalComments": 50,
    "hasMore": true
  }
}
```

#### Create Comment

```
POST /api/comments
```

Request body:

```json
{
  "content": "Comment content",
  "postId": "post-id",
  "parentId": "parent-comment-id" // Optional, for replies
}
```

Response:

```json
{
  "comment": {
    "id": "comment-id",
    "content": "Comment content",
    "author": {
      "id": "user-id",
      "username": "username",
      "name": "User Name",
      "image": "image-url"
    },
    "post": "post-id",
    "parent": "parent-comment-id", // or null
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "upvoteCount": 0,
    "downvoteCount": 0,
    "isUpvoted": false,
    "isDownvoted": false
  }
}
```

#### Update Comment

```
PATCH /api/comments/:commentId
```

Request body:

```json
{
  "content": "Updated comment content"
}
```

Response:

```json
{
  "comment": {
    "id": "comment-id",
    "content": "Updated comment content",
    "author": {
      "id": "user-id",
      "username": "username",
      "name": "User Name",
      "image": "image-url"
    },
    "post": "post-id",
    "parent": "parent-comment-id", // or null
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "upvoteCount": 5,
    "downvoteCount": 1,
    "isUpvoted": true,
    "isDownvoted": false
  }
}
```

#### Delete Comment

```
DELETE /api/comments/:commentId
```

Response:

```json
{
  "success": true
}
```

#### Vote on Comment

```
POST /api/comments/:commentId/vote
```

Request body:

```json
{
  "type": "upvote" // or "downvote"
}
```

Response:

```json
{
  "success": true,
  "upvoteCount": 6,
  "downvoteCount": 1,
  "isUpvoted": true,
  "isDownvoted": false
}
```

### Communities

#### Get Communities

```
GET /api/communities
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20)
- `search`: Search term
- `sort`: Sort by ("popular", "new", "alphabetical")

Response:

```json
{
  "communities": [
    {
      "id": "community-id",
      "name": "Community Name",
      "description": "Community description",
      "slug": "community-slug",
      "image": "image-url",
      "banner": "banner-url",
      "memberCount": 1000,
      "postCount": 500,
      "isPrivate": false,
      "requiresApproval": false,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "isMember": true,
      "role": "ADMIN" // or "MODERATOR", "MEMBER", null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCommunities": 100,
    "hasMore": true
  }
}
```

#### Get Community by Slug

```
GET /api/communities/:slug
```

Response:

```json
{
  "community": {
    "id": "community-id",
    "name": "Community Name",
    "description": "Community description",
    "slug": "community-slug",
    "image": "image-url",
    "banner": "banner-url",
    "memberCount": 1000,
    "postCount": 500,
    "isPrivate": false,
    "requiresApproval": false,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "isMember": true,
    "role": "ADMIN", // or "MODERATOR", "MEMBER", null
    "channels": [
      {
        "id": "channel-id",
        "name": "Channel Name",
        "slug": "channel-slug",
        "description": "Channel description",
        "isDefault": true
      }
    ]
  }
}
```

#### Create Community

```
POST /api/communities
```

Request body:

```json
{
  "name": "Community Name",
  "description": "Community description",
  "isPrivate": false,
  "requiresApproval": false
}
```

Response:

```json
{
  "community": {
    "id": "community-id",
    "name": "Community Name",
    "description": "Community description",
    "slug": "community-slug",
    "image": null,
    "banner": null,
    "memberCount": 1,
    "postCount": 0,
    "isPrivate": false,
    "requiresApproval": false,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "isMember": true,
    "role": "ADMIN",
    "channels": [
      {
        "id": "channel-id",
        "name": "General",
        "slug": "general",
        "description": "General discussion",
        "isDefault": true
      }
    ]
  }
}
```

#### Update Community

```
PATCH /api/communities/:communityId
```

Request body:

```json
{
  "name": "Updated Community Name",
  "description": "Updated community description",
  "isPrivate": true,
  "requiresApproval": true
}
```

Response:

```json
{
  "community": {
    "id": "community-id",
    "name": "Updated Community Name",
    "description": "Updated community description",
    "slug": "community-slug",
    "image": "image-url",
    "banner": "banner-url",
    "memberCount": 1000,
    "postCount": 500,
    "isPrivate": true,
    "requiresApproval": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "isMember": true,
    "role": "ADMIN"
  }
}
```

#### Delete Community

```
DELETE /api/communities/:communityId
```

Response:

```json
{
  "success": true
}
```

#### Join Community

```
POST /api/communities/:communityId/join
```

Response:

```json
{
  "success": true,
  "status": "MEMBER", // or "PENDING" if approval required
  "community": {
    "id": "community-id",
    "name": "Community Name",
    "isMember": true,
    "role": "MEMBER"
  }
}
```

#### Leave Community

```
POST /api/communities/:communityId/leave
```

Response:

```json
{
  "success": true,
  "community": {
    "id": "community-id",
    "name": "Community Name",
    "isMember": false,
    "role": null
  }
}
```

### Users

#### Get Current User

```
GET /api/users/me
```

Response:

```json
{
  "user": {
    "id": "user-id",
    "username": "username",
    "name": "User Name",
    "bio": "User bio",
    "image": "image-url",
    "banner": "banner-url",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "postCount": 50,
    "commentCount": 100,
    "followerCount": 20,
    "followingCount": 30,
    "privacySettings": {
      "isPrivate": false,
      "allowMessages": true,
      "showActivity": true
    }
  }
}
```

#### Get User by ID

```
GET /api/users/:userId
```

Response:

```json
{
  "user": {
    "id": "user-id",
    "username": "username",
    "name": "User Name",
    "bio": "User bio",
    "image": "image-url",
    "banner": "banner-url",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "postCount": 50,
    "commentCount": 100,
    "followerCount": 20,
    "followingCount": 30,
    "isFollowing": false,
    "isFollower": true,
    "isPrivate": false
  }
}
```

#### Update User

```
PATCH /api/users/me
```

Request body:

```json
{
  "name": "Updated User Name",
  "bio": "Updated user bio",
  "privacySettings": {
    "isPrivate": true,
    "allowMessages": false,
    "showActivity": false
  }
}
```

Response:

```json
{
  "user": {
    "id": "user-id",
    "username": "username",
    "name": "Updated User Name",
    "bio": "Updated user bio",
    "image": "image-url",
    "banner": "banner-url",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "privacySettings": {
      "isPrivate": true,
      "allowMessages": false,
      "showActivity": false
    }
  }
}
```

#### Delete User

```
DELETE /api/users/:userId
```

Response:

```json
{
  "success": true
}
```

#### Follow User

```
POST /api/users/:userId/follow
```

Response:

```json
{
  "success": true,
  "isFollowing": true,
  "user": {
    "id": "user-id",
    "username": "username",
    "name": "User Name",
    "followerCount": 21
  }
}
```

#### Unfollow User

```
POST /api/users/:userId/unfollow
```

Response:

```json
{
  "success": true,
  "isFollowing": false,
  "user": {
    "id": "user-id",
    "username": "username",
    "name": "User Name",
    "followerCount": 20
  }
}
```

#### Search Users

```
GET /api/users/search
```

Query parameters:
- `q`: Search query
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20)

Response:

```json
{
  "users": [
    {
      "id": "user-id",
      "username": "username",
      "name": "User Name",
      "image": "image-url"
    }
  ]
}
```

### Messages

#### Get Conversations

```
GET /api/messages
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20)

Response:

```json
{
  "conversations": [
    {
      "userId": "user-id",
      "username": "username",
      "name": "User Name",
      "image": "image-url",
      "lastMessage": "Last message content",
      "lastMessageAt": "2023-01-01T00:00:00.000Z",
      "lastMessageId": "message-id",
      "unreadCount": 3
    }
  ]
}
```

#### Get Messages with User

```
GET /api/messages/:userId
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 50)

Response:

```json
{
  "messages": [
    {
      "id": "message-id",
      "content": "Message content",
      "sender": {
        "id": "user-id",
        "username": "username",
        "name": "User Name",
        "image": "image-url"
      },
      "attachments": [
        {
          "url": "attachment-url",
          "type": "image/jpeg",
          "name": "image.jpg",
          "size": 1024
        }
      ],
      "isRead": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalMessages": 100,
    "totalPages": 2,
    "hasMore": true
  }
}
```

#### Send Message

```
POST /api/messages/:userId
```

Request body:

```json
{
  "content": "Message content",
  "attachments": [
    {
      "url": "attachment-url",
      "type": "image/jpeg",
      "name": "image.jpg",
      "size": 1024
    }
  ]
}
```

Response:

```json
{
  "message": {
    "id": "message-id",
    "content": "Message content",
    "sender": {
      "id": "user-id",
      "username": "username",
      "name": "User Name",
      "image": "image-url"
    },
    "attachments": [
      {
        "url": "attachment-url",
        "type": "image/jpeg",
        "name": "image.jpg",
        "size": 1024
      }
    ],
    "isRead": false,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Mark Message as Read

```
PUT /api/messages/:messageId/read
```

Response:

```json
{
  "message": {
    "id": "message-id",
    "isRead": true
  }
}
```

### Notifications

#### Get Notifications

```
GET /api/notifications
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 20)
- `unreadOnly`: Set to `true` to get only unread notifications

Response:

```json
{
  "notifications": [
    {
      "id": "notification-id",
      "type": "FOLLOW", // or "MENTION", "COMMENT", "REPLY", "VOTE", "MEMBERSHIP"
      "actor": {
        "id": "user-id",
        "username": "username",
        "name": "User Name",
        "image": "image-url"
      },
      "target": {
        "id": "target-id",
        "type": "POST", // or "COMMENT", "USER", "COMMUNITY"
        "preview": "Target content preview"
      },
      "isRead": false,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalNotifications": 50,
    "hasMore": true
  },
  "unreadCount": 10
}
```

#### Mark Notification as Read

```
PUT /api/notifications/:notificationId/read
```

Response:

```json
{
  "notification": {
    "id": "notification-id",
    "isRead": true
  }
}
```

#### Mark All Notifications as Read

```
PUT /api/notifications/read-all
```

Response:

```json
{
  "success": true,
  "count": 10
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Rate limits vary by endpoint and are specified in the response headers:

- `X-RateLimit-Limit`: Maximum number of requests allowed in the window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Time when the current window resets (Unix timestamp)

When a rate limit is exceeded, the API returns a `429 Too Many Requests` response.

## Caching

The API implements caching to improve performance. Cache headers are included in the response:

- `Cache-Control`: Caching directives
- `ETag`: Entity tag for conditional requests

## Webhooks

The API supports webhooks for real-time notifications. Webhooks can be configured in the developer settings.

## API Versioning

The API is versioned to ensure backward compatibility. The current version is v1.

## Support

For API support, please contact support@chattersphere.com.
