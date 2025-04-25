// src/context/PostContext.tsx
"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    ReactNode,
} from "react";

export interface Post {
    id: string;
    author: {
        _id: string;
        username: string;
        name: string;
        image?: string;
    };
    content: string;
    community?: { _id: string; name: string; image?: string };
    upvoteCount: number;
    downvoteCount: number;
    voteCount: number;
    commentCount: number;
    isUpvoted: boolean;
    isDownvoted: boolean;
    createdAt: string;
    updatedAt: string;
}

interface PostContextType {
    posts: Post[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    fetchMorePosts: () => Promise<void>;
    createPost: (
        content: string,
        communityId?: string
    ) => Promise<Post | null>;
    votePost: (postId: string, voteType: "upvote" | "downvote") => Promise<void>;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: ReactNode }> = ({
                                                                    children,
                                                                }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchPosts = useCallback(
        async (reset = false) => {
            if (loading) return;
            setLoading(true);
            try {
                const nextPage = reset ? 1 : page;
                const res = await fetch(
                    `/api/posts/feed?page=${nextPage}&limit=10`
                );
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(data.error || `Fetch failed (${res.status})`);
                }
                setPosts((prev) =>
                    reset ? data.posts : [...prev, ...data.posts]
                );
                setHasMore(data.pagination.hasMore);
                setPage(reset ? 2 : page + 1);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        },
        [page, loading]
    );

    const fetchMorePosts = useCallback(() => fetchPosts(false), [fetchPosts]);

    const createPost = useCallback(
        async (content: string, communityId?: string): Promise<Post | null> => {
            setLoading(true);
            try {
                const res = await fetch("/api/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content, communityId }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    // don't log or throw—just return null
                    return null;
                }
                setPosts((prev) => [data.post, ...prev]);
                return data.post;
            } catch {
                // on exception, return null
                return null;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const votePost = useCallback(
        async (postId: string, voteType: "upvote" | "downvote") => {
            try {
                const res = await fetch(`/api/posts/${postId}/vote`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ voteType }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || `Vote failed (${res.status})`);
                setPosts((prev) =>
                    prev.map((p) =>
                        p.id === postId
                            ? {
                                ...p,
                                upvoteCount: data.upvoteCount,
                                downvoteCount: data.downvoteCount,
                                voteCount: data.voteCount,
                                isUpvoted: data.isUpvoted,
                                isDownvoted: data.isDownvoted,
                            }
                            : p
                    )
                );
            } catch {
                // swallow vote errors
            }
        },
        []
    );

    useEffect(() => {
        fetchPosts(true);
    }, [fetchPosts]);

    return (
        <PostContext.Provider
            value={{
                posts,
                loading,
                error,
                hasMore,
                fetchMorePosts,
                createPost,
                votePost,
            }}
        >
            {children}
        </PostContext.Provider>
    );
};

export const usePosts = () => {
    const ctx = useContext(PostContext);
    if (!ctx) {
        throw new Error("usePosts must be used within a PostProvider");
    }
    return ctx;
};
