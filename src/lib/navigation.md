# ChatterSphere Navigation Utilities

This module provides a set of utilities for consistent navigation throughout the ChatterSphere application.

## Features

- URL builder functions for consistent URL generation
- Navigation hooks for client-side navigation
- Context provider for sharing navigation utilities across components
- Comprehensive test coverage

## Usage

### URL Builder Functions

The `routes` object provides functions for generating URLs for various parts of the application:

```tsx
import { routes } from '@/lib/navigation';

// Generate a URL for a user profile
const profileUrl = routes.profile('user-123'); // '/profile/user-123'

// Generate a URL for a community
const communityUrl = routes.community('test-community'); // '/communities/test-community'

// Generate a URL for a post
const postUrl = routes.post('post-123'); // '/posts/post-123'
```

### Navigation Hook

The `useNavigation` hook provides functions for navigating to different parts of the application:

```tsx
import { useNavigation } from '@/lib/navigation';

function MyComponent() {
  const navigation = useNavigation();
  
  const handleProfileClick = () => {
    navigation.goToProfile('user-123');
  };
  
  const handleCommunityClick = () => {
    navigation.goToCommunity('test-community');
  };
  
  return (
    <div>
      <button onClick={handleProfileClick}>Go to Profile</button>
      <button onClick={handleCommunityClick}>Go to Community</button>
    </div>
  );
}
```

### Navigation Provider

The `NavigationProvider` component provides the navigation utilities to all child components:

```tsx
import { NavigationProvider } from '@/lib/navigation';

function App() {
  return (
    <NavigationProvider>
      <MyComponent />
    </NavigationProvider>
  );
}
```

### Navigation Context

The `useNavigationContext` hook provides access to the navigation utilities from the context:

```tsx
import { useNavigationContext } from '@/lib/navigation';

function MyComponent() {
  const navigation = useNavigationContext();
  
  const handleProfileClick = () => {
    navigation.goToProfile('user-123');
  };
  
  return (
    <div>
      <button onClick={handleProfileClick}>Go to Profile</button>
    </div>
  );
}
```

## Using with Next.js Link Component

The navigation utilities can be used with the Next.js Link component for better SEO and accessibility:

```tsx
import Link from 'next/link';
import { useNavigation, routes } from '@/lib/navigation';

function MyComponent() {
  const navigation = useNavigation();
  
  return (
    <Link 
      href={routes.profile('user-123')} 
      onClick={(e) => navigation.goToProfile('user-123', e)}
    >
      Go to Profile
    </Link>
  );
}
```

## Available Navigation Functions

- `goToProfile(userId, event?)` - Navigate to a user profile
- `goToCommunity(communitySlug, communityId?, event?)` - Navigate to a community
- `goToPost(postId, event?)` - Navigate to a post
- `goToFollowers(userId, event?)` - Navigate to a user's followers
- `goToFollowing(userId, event?)` - Navigate to a user's following
- `goToChannel(communitySlug, channelSlug, event?)` - Navigate to a community channel
- `goToHome(event?)` - Navigate to the home feed
- `goToPopular(event?)` - Navigate to the popular feed
- `goToExplore(event?)` - Navigate to the explore page
- `goToNotifications(event?)` - Navigate to the notifications page
- `goToSaved(event?)` - Navigate to the saved posts page
- `goToMessages(event?)` - Navigate to the messages page
- `goToSettings(event?)` - Navigate to the settings page
- `goToHelp(event?)` - Navigate to the help page
- `goToCreateCommunity(event?)` - Navigate to the create community page

## Testing

The navigation utilities are thoroughly tested with Jest and React Testing Library. See the `__tests__` directory for examples.
