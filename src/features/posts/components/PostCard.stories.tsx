import type { Meta, StoryObj } from "@storybook/react";
import PostCard from "@/features/posts/components/PostCard";

const meta: Meta<typeof PostCard> = {
  title: "Features/Posts/PostCard",
  component: PostCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
The PostCard component displays a post with:
- Author information and timestamp
- Post content with media support
- Vote buttons (upvote/downvote)
- Comment count and link
- Community information
- Action buttons (save, share, more options)
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    post: {
      description: "Post data object",
      control: "object",
    },
    onVote: {
      description: "Callback for vote actions",
      action: "vote",
    },
    onComment: {
      description: "Callback for comment actions",
      action: "comment",
    },
    onSave: {
      description: "Callback for save actions",
      action: "save",
    },
    onShare: {
      description: "Callback for share actions",
      action: "share",
    },
  },
};

export default meta;
type Story = StoryObj<typeof PostCard>;

const basePost = {
  id: "1",
  title: "Getting Started with React Hooks",
  content: "React Hooks have revolutionized the way we write React components. In this post, I'll share some best practices and common patterns I've learned while working with hooks in production applications.",
  author: {
    id: "user1",
    username: "johndoe",
    name: "John Doe",
    image: "/avatars/alex.png",
  },
  community: {
    id: "react-devs",
    name: "React Developers",
    slug: "react-developers",
    image: "/avatars/placeholder.png",
  },
  createdAt: new Date("2024-01-15T10:30:00Z"),
  updatedAt: new Date("2024-01-15T10:30:00Z"),
  upvotes: 24,
  downvotes: 2,
  commentCount: 8,
  userVote: null as "upvote" | "downvote" | null,
  isOwner: false,
  isSaved: false,
  mediaUrls: [],
  tags: ["react", "hooks", "frontend"],
};

export const Default: Story = {
  args: {
    post: basePost,
  },
};

export const UpvotedPost: Story = {
  args: {
    post: {
      ...basePost,
      userVote: "upvote" as const,
      upvotes: 25,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Post that the current user has upvoted.",
      },
    },
  },
};

export const DownvotedPost: Story = {
  args: {
    post: {
      ...basePost,
      userVote: "downvote" as const,
      downvotes: 3,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Post that the current user has downvoted.",
      },
    },
  },
};

export const SavedPost: Story = {
  args: {
    post: {
      ...basePost,
      isSaved: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Post that the current user has saved.",
      },
    },
  },
};

export const OwnPost: Story = {
  args: {
    post: {
      ...basePost,
      isOwner: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Post created by the current user, showing additional options.",
      },
    },
  },
};

export const PostWithMedia: Story = {
  args: {
    post: {
      ...basePost,
      title: "My Latest Project Screenshots",
      content: "Here are some screenshots of the project I've been working on. Built with React, TypeScript, and Tailwind CSS.",
      mediaUrls: [
        "/conversations-illustration.svg",
        "/logo.png",
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Post containing media attachments.",
      },
    },
  },
};

export const PopularPost: Story = {
  args: {
    post: {
      ...basePost,
      title: "Why TypeScript is Essential for Large React Applications",
      content: "After working on several large-scale React applications, I've come to appreciate the value that TypeScript brings to the development experience. Here's why I think every React team should consider TypeScript...",
      upvotes: 156,
      downvotes: 8,
      commentCount: 42,
      userVote: "upvote" as const,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "A popular post with high engagement.",
      },
    },
  },
};

export const ControversialPost: Story = {
  args: {
    post: {
      ...basePost,
      title: "Unpopular Opinion: CSS-in-JS is Overrated",
      content: "I know this might be controversial, but I think the React community has gone too far with CSS-in-JS solutions. Sometimes good old CSS modules or even regular CSS works just fine...",
      upvotes: 45,
      downvotes: 38,
      commentCount: 89,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "A controversial post with significant downvotes and many comments.",
      },
    },
  },
};

export const LongContent: Story = {
  args: {
    post: {
      ...basePost,
      title: "Complete Guide to React Performance Optimization",
      content: `Performance optimization in React applications is crucial for delivering excellent user experiences. In this comprehensive guide, I'll cover various techniques and strategies that can help you build faster React applications.

## 1. Component Optimization

One of the most important aspects of React performance is optimizing your components. This includes using React.memo for functional components, PureComponent for class components, and understanding when to use useMemo and useCallback hooks.

## 2. Bundle Optimization

Code splitting is essential for large applications. React provides built-in support for dynamic imports and lazy loading, which can significantly reduce your initial bundle size.

## 3. State Management

Proper state management can prevent unnecessary re-renders. Consider using tools like Redux, Zustand, or React's built-in Context API wisely.

## 4. Virtualization

For large lists, consider using virtualization libraries like react-window or react-virtualized to render only visible items.

The key is to measure first, then optimize based on actual performance bottlenecks rather than premature optimization.`,
      upvotes: 78,
      downvotes: 3,
      commentCount: 24,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Post with long content to test text truncation and expansion.",
      },
    },
  },
};

export const NewPost: Story = {
  args: {
    post: {
      ...basePost,
      title: "Just started learning React!",
      content: "Hi everyone! I'm new to React and this community. Looking forward to learning from all of you. Any tips for a beginner?",
      createdAt: new Date(Date.now() - 300000), // 5 minutes ago
      upvotes: 3,
      downvotes: 0,
      commentCount: 2,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "A new post with recent timestamp and low engagement.",
      },
    },
  },
};

export const PostWithoutCommunity: Story = {
  args: {
    post: {
      ...basePost,
      community: null,
      title: "General Discussion Post",
      content: "This is a general post not associated with any specific community.",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Post not associated with a specific community.",
      },
    },
  },
};

export const InteractiveExample: Story = {
  args: {
    post: basePost,
    onVote: async (postId: string, voteType: "upvote" | "downvote") => {
      console.log(`Voted ${voteType} on post:`, postId);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onComment: (postId: string) => {
      console.log("Commenting on post:", postId);
    },
    onSave: async (postId: string) => {
      console.log("Saving post:", postId);
      await new Promise(resolve => setTimeout(resolve, 300));
    },
    onShare: (postId: string) => {
      console.log("Sharing post:", postId);
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive example showing all post interactions. Check the console for actions.",
      },
    },
  },
};

export const LoadingStates: Story = {
  args: {
    post: basePost,
    onVote: async () => {
      // Simulate slow network
      await new Promise(resolve => setTimeout(resolve, 3000));
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates loading states during interactions.",
      },
    },
  },
};
