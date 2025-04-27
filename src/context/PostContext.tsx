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
        id: string;
        username: string;
        name: string;
        image?: string;
    };
    content: string;
    community?: {
        id: string;
        name: string;
        image?: string;
    };
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
    votePost: (
        postId: string,
        voteType: "upvote" | "downvote"
    ) => Promise<void>;
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
            if (!reset && loading) return;
            setLoading(true);
            try {
                const nextPage = reset ? 1 : page;
                console.log(`[PostContext] Fetching posts: page=${nextPage}, limit=10`);

                const res = await fetch(
                    `/api/posts/feed?page=${nextPage}&limit=10`
                );

                const data = await res.json().catch((err) => {
                    console.error('[PostContext] Error parsing response:', err);
                    return {};
                });

                if (!res.ok) {
                    const errorMessage = data.error || `Fetch failed (${res.status})`;
                    const errorDetails = data.details ? `: ${data.details}` : '';
                    console.error(`[PostContext] API error: ${errorMessage}${errorDetails}`);
                    throw new Error(`${errorMessage}${errorDetails}`);
                }

                console.log(`[PostContext] Fetched ${data.posts?.length || 0} posts`);

                if (!data.posts || !Array.isArray(data.posts)) {
                    console.error('[PostContext] Invalid response format - posts array missing');
                    throw new Error('Invalid response format');
                }

                setPosts((prev) =>
                    reset ? data.posts : [...prev, ...data.posts]
                );
                setHasMore(data.pagination?.hasMore || false);
                setPage(reset ? 2 : page + 1);
                setError(null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                console.error('[PostContext] Error fetching posts:', errorMessage);
                setError(errorMessage);
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
            setError(null);
            try {
                console.log(`[PostContext] Creating post with content length: ${content.length}${communityId ? `, communityId: ${communityId}` : ''}`);

                const res = await fetch("/api/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content, communityId }),
                });

                const data = await res.json().catch((err) => {
                    console.error('[PostContext] Error parsing response:', err);
                    return {};
                });

                if (!res.ok) {
                    const errorMessage = data.error || `Failed to create post (${res.status})`;
                    const errorDetails = data.details ? `: ${data.details}` : '';
                    console.error(`[PostContext] API error: ${errorMessage}${errorDetails}`);
                    setError(`${errorMessage}${errorDetails}`);
                    return null;
                }

                console.log('[PostContext] Post created successfully:', data.post?.id);
                setPosts((prev) => [data.post, ...prev]);
                return data.post;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error creating post';
                console.error('[PostContext] Exception:', errorMessage);
                setError(errorMessage);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [setError]
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