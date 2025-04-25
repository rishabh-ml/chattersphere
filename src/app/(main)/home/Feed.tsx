"use client";

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import PostCard from '@/components/post-card';
import { type Post } from '@/types';
import { motion } from 'framer-motion';

export default function Feed() {
    const [posts, setPosts] = useState<Post[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await fetch('/api/posts');
                if (!res.ok) throw new Error('Failed to fetch posts');
                const data = await res.json();
                setPosts(data.posts);
                setError(null);
            } catch (error) {
                console.error('Error fetching posts:', error);
                setError('Failed to load posts. Please try again later.');
                setPosts(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const renderSkeletons = () => (
        <div className="flex flex-col gap-6">
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
                >
                    <Skeleton className="h-32 w-full rounded-xl" />
                </motion.div>
            ))}
        </div>
    );


    const renderFallbackPost = () => (
        <div className="text-center">
            <p className="text-gray-500 mb-4">No posts available. Here&#39;s a placeholder post:</p>
            <PostCard
                post={{
                    id: 'dummy-id',
                    author: { name: 'Rishabh' },
                    content:
                        'Hey Guys, we are in the middle of the Development of the ChatterSphere. First of all, I wanna thank you all for creating an account on the platform. Stay tuned for more updates!',
                    createdAt: new Date().toISOString(),
                }}
            />
        </div>
    );

    return (
        <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {loading && renderSkeletons()}
            {!loading && error && (
                <div className="text-center text-red-500">
                    <p>{error}</p>
                </div>
            )}
            {!loading && posts && posts.length > 0 && (
                <>
                    {posts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                            <PostCard post={post} />
                        </motion.div>
                    ))}
                </>
            )}
            {!loading && !error && (!posts || posts.length === 0) && renderFallbackPost()}
        </motion.div>
    );
}