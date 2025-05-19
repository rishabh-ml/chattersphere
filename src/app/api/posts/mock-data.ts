// src/app/api/posts/mock-data.ts
import { v4 as uuidv4 } from 'uuid';

export const generateMockPosts = (count = 10) => {
  const posts = [];

  for (let i = 0; i < count; i++) {
    const id = uuidv4();
    const createdAt = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));

    posts.push({
      id,
      author: {
        id: `author_${i}`,
        name: `User ${i}`,
        username: `user${i}`,
        image: `https://placehold.co/100x100?text=U${i}`
      },
      content: `<p>This is a mock post #${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.</p>`,
      community: i % 3 === 0 ? {
        id: `community_${i % 5}`,
        name: `Community ${i % 5}`,
        slug: `community-${i % 5}`,
        image: `https://placehold.co/100x100?text=C${i % 5}`
      } : undefined,
      upvoteCount: Math.floor(Math.random() * 100),
      downvoteCount: Math.floor(Math.random() * 20),
      voteCount: Math.floor(Math.random() * 80),
      commentCount: Math.floor(Math.random() * 50),
      isUpvoted: Math.random() > 0.5,
      isDownvoted: Math.random() > 0.8,
      isSaved: Math.random() > 0.7,
      mediaUrls: i % 4 === 0 ? [`https://placehold.co/600x400?text=Post+Image+${i}`] : [],
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString()
    });
  }

  return posts;
};
