# ChatterSphere Application Architecture

## Overview

ChatterSphere is a modern social media platform built with Next.js, React, and TypeScript. This document outlines the project architecture, organization, and development conventions.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (main)/           # Main authenticated routes
│   ├── api/              # API routes
│   └── ...               # Other route groups
├── features/             # Feature-based code organization
│   ├── auth/             # Authentication related features
│   │   ├── components/   # Auth components (SignInForm, SignUpForm, etc)
│   │   ├── hooks/        # Auth hooks (useAuthManager)
│   │   ├── services/     # Auth services
│   │   └── types/        # Auth type definitions
│   ├── communities/      # Community features
│   │   ├── components/   # Community components
│   │   ├── contexts/     # Community-specific contexts
│   │   ├── hooks/        # Community hooks
│   │   ├── services/     # Community API services
│   │   └── types/        # Community type definitions
│   ├── messages/         # Messaging features
│   │   ├── components/   # Message components (ConversationView, NewMessage, etc)
│   │   ├── contexts/     # Message-specific contexts
│   │   ├── hooks/        # Message hooks (useMessages)
│   │   ├── services/     # Message API services
│   │   └── types/        # Message type definitions
│   ├── notifications/    # Notification features
│   │   ├── components/   # Notification components (NotificationsList, Badge, etc)
│   │   ├── hooks/        # Notification hooks (useNotifications)
│   │   ├── services/     # Notification API services
│   │   └── types/        # Notification type definitions
│   ├── posts/            # Post features
│   │   ├── components/   # Post components
│   │   ├── contexts/     # Post-specific contexts
│   │   ├── hooks/        # Post hooks
│   │   ├── services/     # Post API services
│   │   └── types/        # Post type definitions
│   ├── profiles/         # User profile features
│   │   ├── components/   # Profile components
│   │   ├── services/     # Profile API services
│   │   └── types/        # Profile type definitions
│   └── settings/         # Settings features
│       └── components/   # Settings components
├── shared/               # Shared utilities and components
│   ├── hooks/            # Shared React hooks
│   ├── providers/        # Context providers
│   ├── services/         # Shared services (apiClient)
│   ├── types/            # Shared TypeScript types
│   ├── ui/               # Shared UI components
│   └── utils/            # Utility functions (cn)
├── components/           # Legacy UI components (to be migrated)
├── lib/                  # Infrastructure code
└── middleware/           # Next.js middleware
```

## Feature Structure

Each feature follows a consistent structure:

```
features/[feature-name]/
├── components/           # React components specific to the feature
├── hooks/                # Custom React hooks
├── services/             # API services and business logic
├── types/                # TypeScript types and interfaces
└── utils/                # Feature-specific utility functions
```

## Development Conventions

### Component Organization

- **Atomic Design Pattern**: Components are organized based on composition complexity
- **Component Structure**: Each component has a clear, single responsibility
- **Client/Server Separation**: "use client" directives used only where needed

### Data Fetching

- **React Query**: Used for data fetching, caching, and state management
- **API Services**: Centralized API access through feature-specific service modules
- **Type Safety**: Full TypeScript coverage for API responses and state

### State Management

- **React Query**: For server state (data from API)
- **React Hooks**: For local component state
- **Context**: For shared state across components within a feature

### Styling

- **Tailwind CSS**: Used for styling with utility classes
- **Shadcn UI**: Component library extending Tailwind CSS
- **CSS Variables**: For theme configuration

### Testing

- **Jest**: For unit and integration tests
- **Cypress**: For end-to-end tests
- **Component Tests**: For testing component behavior in isolation

## Key Patterns

### Feature-First Organization

Code is organized primarily by domain feature rather than technical role, making the codebase more intuitive to navigate and understand.

### API Client Pattern

A centralized API client handling common concerns:
- Request/response formatting
- Error handling
- Authentication
- Retries

### Domain-Driven Services

Services are organized by domain concepts rather than technical function, making business logic more maintainable.

### Page-Component Separation

Pages are thin wrappers around feature components, keeping routing logic separate from presentation and business logic.

### React Query Integration

Services and hooks are tightly integrated with React Query for consistent:
- Data fetching
- Caching
- Loading states
- Error handling
- Optimistic updates

## Implementation Status

### Completed
- ✅ Created feature-based directory structure
- ✅ Moved post feature components, contexts, and services
- ✅ Moved communities feature components, contexts, and services
- ✅ Moved profiles feature components and services
- ✅ Created centralized API client
- ✅ Created message feature components, contexts, types, and services
- ✅ Created notifications feature components, types, and services
- ✅ Created auth feature components, types, and services

### Pending
- ⬜ Move all legacy components to respective feature directories
- ⬜ Update import paths throughout the codebase
- ⬜ Create unit tests for new services
- ⬜ Implement storybook documentation for UI components
- ⬜ Create proper API documentation for services

## Best Practices

1. **Feature isolation**: Features should be as self-contained as possible
2. **Shared abstractions**: Common patterns should be abstracted into the shared directory
3. **TypeScript everywhere**: Ensure full type coverage for improved reliability
4. **Meaningful directory names**: Names should reflect purpose, not technical role
5. **Co-location**: Related files should be kept together
6. **Testability**: Design components and services with testing in mind
7. **Performance awareness**: Consider performance implications of component designs
