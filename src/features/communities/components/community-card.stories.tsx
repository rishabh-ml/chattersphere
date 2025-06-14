import type { Meta, StoryObj } from "@storybook/react";
import CommunityCard from "@/features/communities/components/community-card";
import { Community } from "@/context/CommunityContext";

const meta: Meta<typeof CommunityCard> = {
  title: "Features/Communities/CommunityCard",
  component: CommunityCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
The CommunityCard component displays information about a community including:
- Community name, description, and member count
- Join/Leave functionality
- Visual indicators for private communities
- Responsive design with hover effects
        `,
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    community: {
      description: "Community data object",
      control: "object",
    },
    onJoinLeave: {
      description: "Callback function for join/leave actions",
      action: "joinLeave",
    },
    onSelect: {
      description: "Callback function when community is selected",
      action: "select",
    },
  },
};

export default meta;
type Story = StoryObj<typeof CommunityCard>;

const baseCommunity: Community = {
  id: "1",
  name: "React Developers",
  slug: "react-developers",
  description: "A vibrant community for React.js developers to share knowledge, ask questions, and collaborate on projects.",
  image: "/avatars/placeholder.png",
  banner: null,
  isPrivate: false,
  requiresApproval: false,
  memberCount: 1247,
  postCount: 89,
  channelCount: 5,
  isCreator: false,
  isMember: false,
  isModerator: false,
  creator: {
    id: "creator1",
    username: "johndoe",
    name: "John Doe",
    image: "/avatars/alex.png",
  },
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-20"),
};

export const Default: Story = {
  args: {
    community: baseCommunity,
  },
};

export const MemberCommunity: Story = {
  args: {
    community: {
      ...baseCommunity,
      isMember: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Shows how the card looks when the user is already a member of the community.",
      },
    },
  },
};

export const PrivateCommunity: Story = {
  args: {
    community: {
      ...baseCommunity,
      name: "Private Discussions",
      slug: "private-discussions",
      description: "A private community for exclusive discussions and content sharing among verified members.",
      isPrivate: true,
      requiresApproval: true,
      memberCount: 89,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Displays a private community that requires approval to join.",
      },
    },
  },
};

export const CreatorCommunity: Story = {
  args: {
    community: {
      ...baseCommunity,
      isCreator: true,
      isMember: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Shows the community card when the current user is the creator of the community.",
      },
    },
  },
};

export const LargeCommunity: Story = {
  args: {
    community: {
      ...baseCommunity,
      name: "JavaScript Universe",
      slug: "javascript-universe",
      description: "The largest community for JavaScript developers covering all frameworks, libraries, and tools in the JavaScript ecosystem.",
      memberCount: 45678,
      postCount: 2543,
      channelCount: 15,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Example of a large community with high member and post counts.",
      },
    },
  },
};

export const SmallCommunity: Story = {
  args: {
    community: {
      ...baseCommunity,
      name: "Vue.js Beginners",
      slug: "vuejs-beginners",
      description: "A small but friendly community for developers just starting with Vue.js.",
      memberCount: 23,
      postCount: 7,
      channelCount: 2,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Example of a smaller, newer community with lower activity.",
      },
    },
  },
};

export const CommunityWithBanner: Story = {
  args: {
    community: {
      ...baseCommunity,
      name: "Design Systems",
      slug: "design-systems",
      description: "Learn and discuss design systems, component libraries, and design tokens.",
      banner: "/conversations-illustration.svg",
      memberCount: 892,
      postCount: 156,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Community card with a banner image.",
      },
    },
  },
};

export const LongDescription: Story = {
  args: {
    community: {
      ...baseCommunity,
      name: "Full Stack Development",
      slug: "full-stack-development",
      description: "A comprehensive community for full-stack developers covering frontend technologies like React, Vue, Angular, backend technologies like Node.js, Python, Go, databases like PostgreSQL, MongoDB, and deployment strategies including Docker, Kubernetes, and cloud platforms.",
      memberCount: 3456,
      postCount: 678,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Community with a longer description to test text truncation and layout.",
      },
    },
  },
};

export const ModeratorCommunity: Story = {
  args: {
    community: {
      ...baseCommunity,
      name: "Community Moderators",
      slug: "community-moderators",
      description: "A space for community moderators to share best practices and discuss moderation strategies.",
      isMember: true,
      isModerator: true,
      memberCount: 156,
      postCount: 34,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Shows the card when the user is a moderator of the community.",
      },
    },
  },
};

export const InteractiveExample: Story = {
  args: {
    community: baseCommunity,
    onJoinLeave: async (communityId: string, isMember: boolean) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`${isMember ? "Left" : "Joined"} community:`, communityId);
    },
    onSelect: (community: Community) => {
      console.log("Selected community:", community);
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive example showing join/leave and select functionality. Check the console for actions.",
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    community: baseCommunity,
    onJoinLeave: async () => {
      // Simulate a long-running operation
      await new Promise(resolve => setTimeout(resolve, 5000));
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates the loading state when joining/leaving a community.",
      },
    },
  },
};
