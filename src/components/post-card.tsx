"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, MessageSquare, Bookmark, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { type Post } from "@/context/PostContext";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import DOMPurify from "isomorphic-dompurify";

interface PostCardProps {
    post: Post;
    onVote?: (postId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
}

export default function PostCard({ post, onVote }: PostCardProps) {
    const [upvoteCount, setUpvoteCount] = useState(post.upvoteCount);
    const [downvoteCount, setDownvoteCount] = useState(post.downvoteCount);
    const [voteCount, setVoteCount] = useState(post.voteCount);
    const [isUpvoted, setIsUpvoted] = useState(post.isUpvoted);
    const [isDownvoted, setIsDownvoted] = useState(post.isDownvoted);
    const [saved, setSaved] = useState(false);

    const handleUpvote = async () => {
        if (onVote) {
            await onVote(post.id, 'upvote');
        } else {
            // Optimistic update if no onVote handler is provided
            if (isUpvoted) {
                setVoteCount(voteCount - 1);
                setUpvoteCount(upvoteCount - 1);
                setIsUpvoted(false);
            } else {
                setVoteCount(isDownvoted ? voteCount + 2 : voteCount + 1);
                setUpvoteCount(upvoteCount + 1);
                if (isDownvoted) {
                    setDownvoteCount(downvoteCount - 1);
                    setIsDownvoted(false);
                }
                setIsUpvoted(true);
            }
        }
    };

    const handleDownvote = async () => {
        if (onVote) {
            await onVote(post.id, 'downvote');
        } else {
            // Optimistic update if no onVote handler is provided
            if (isDownvoted) {
                setVoteCount(voteCount + 1);
                setDownvoteCount(downvoteCount - 1);
                setIsDownvoted(false);
            } else {
                setVoteCount(isUpvoted ? voteCount - 2 : voteCount - 1);
                setDownvoteCount(downvoteCount + 1);
                if (isUpvoted) {
                    setUpvoteCount(upvoteCount - 1);
                    setIsUpvoted(false);
                }
                setIsDownvoted(true);
            }
        }
    };

    const toggleSave = () => {
        setSaved(!saved);
    };

    return (
        <motion.div
            className="bg-white rounded-lg border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200"
            whileHover={{ y: -2 }}
        >
            <div className="p-4 md:p-5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        {post.author.image ? (
                            <div className="relative h-8 w-8 rounded-full overflow-hidden">
                                <Image
                                    src={post.author.image}
                                    alt={post.author.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                    {post.author.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div>
                            <Link href={`/profile/${post.author._id}`} className="text-sm font-medium text-gray-900 hover:text-[#00AEEF] transition-colors">
                                {post.author.name}
                            </Link>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                </span>
                                {post.community && (
                                    <>
                                        <span className="text-xs text-gray-500">•</span>
                                        <Link href={`/community/${post.community._id}`}>
                                            <Badge variant="outline" className="text-xs bg-blue-50 text-[#00AEEF] hover:bg-blue-100 border-blue-100">
                                                {post.community.name}
                                            </Badge>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>



                <div
                    className="text-gray-700 text-sm mb-4 post-content prose prose-sm max-w-none prose-headings:font-semibold prose-h3:text-lg prose-h4:text-base prose-p:mb-3 prose-ul:ml-6 prose-ol:ml-6 prose-li:mb-1 prose-strong:font-semibold prose-em:italic"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                    aria-label="Post content"
                />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Voting */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-full hover:bg-blue-50",
                                    isUpvoted ? "text-[#00AEEF]" : "text-gray-500 hover:text-[#00AEEF]",
                                )}
                                onClick={handleUpvote}
                            >
                                <ArrowUp className="h-4 w-4" />
                                <span className="sr-only">Upvote</span>
                            </Button>

                            <span
                                className={cn(
                                    "text-sm font-medium",
                                    isUpvoted ? "text-[#00AEEF]" : isDownvoted ? "text-red-500" : "text-gray-600",
                                )}
                            >
                {voteCount}
              </span>

                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-full hover:bg-blue-50",
                                    isDownvoted ? "text-red-500" : "text-gray-500 hover:text-red-500",
                                )}
                                onClick={handleDownvote}
                            >
                                <ArrowDown className="h-4 w-4" />
                                <span className="sr-only">Downvote</span>
                            </Button>
                        </div>

                        {/* Comments */}
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-gray-500 hover:text-[#00AEEF] hover:bg-blue-50">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-xs">{post.commentCount}</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Save */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-full hover:bg-blue-50",
                                saved ? "text-[#00AEEF]" : "text-gray-500 hover:text-[#00AEEF]",
                            )}
                            onClick={toggleSave}
                        >
                            <Bookmark className="h-4 w-4" fill={saved ? "#00AEEF" : "none"} />
                            <span className="sr-only">Save</span>
                        </Button>

                        {/* Share */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-gray-500 hover:text-[#00AEEF] hover:bg-blue-50"
                        >
                            <Share2 className="h-4 w-4" />
                            <span className="sr-only">Share</span>
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
