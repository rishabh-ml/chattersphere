"use client";

import { useEffect, useState } from "react";
import { fetchFeedData } from "@/utils/fetchFeedData";
import PostCard from "../../components/PostCard";
import FeedSkeleton from "../../components/FeedSkeleton";
import EmptyFeed from "../../components/EmptyFeed";

interface Post {
    id: string;
    title: string;
    body: string;
    author: string;
    createdAt: string;
    votes: number;
    commentsCount: number;
}

export default function Feed() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadFeed() {
            try {
                const data = await fetchFeedData();
                setPosts(data);
            } catch (err) {
                setError("Failed to load feed. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        }
        loadFeed();
    }, []);

    if (isLoading) return <FeedSkeleton />;
    if (error) return <div className="text-center text-red-500">{error}</div>;
    if (posts.length === 0) return <EmptyFeed />;

    return (
        <div className="space-y-6">
            {posts.map((post) => (
                <PostCard key={post.id} {...post} />
            ))}
        </div>
    );
}
