"use client"

import { useState } from "react"
import { ArrowUp, ArrowDown, MessageSquare, Bookmark, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { type Post } from "@/types"

interface PostCardProps {
    post: Post;
}

export default function PostCard({ post }: PostCardProps) {
    const [upvotes, setUpvotes] = useState(post.upvotes || 0)
    const [userVote, setUserVote] = useState<"up" | "down" | null>(null)
    const [saved, setSaved] = useState(post.saved || false)

    const handleUpvote = () => {
        if (userVote === "up") {
            setUpvotes(upvotes - 1)
            setUserVote(null)
        } else {
            setUpvotes(userVote === "down" ? upvotes + 2 : upvotes + 1)
            setUserVote("up")
        }
    }

    const handleDownvote = () => {
        if (userVote === "down") {
            setUpvotes(upvotes + 1)
            setUserVote(null)
        } else {
            setUpvotes(userVote === "up" ? upvotes - 2 : upvotes - 1)
            setUserVote("down")
        }
    }

    const toggleSave = () => {
        setSaved(!saved)
    }

    return (
        <motion.div
            className="bg-white rounded-lg border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200"
            whileHover={{ y: -2 }}
        >
            <div className="p-4 md:p-5">
                <div className="flex items-center gap-2 mb-2">
                    {post.community && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-[#00AEEF] hover:bg-blue-100 border-blue-100">
                            {post.community}
                        </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                        Posted by {post.authorName} • {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                </div>

                {post.title && (
                    <h2 className="text-lg font-semibold text-gray-800 mb-2 leading-tight">{post.title}</h2>
                )}

                <p className="text-gray-600 text-sm mb-4">{post.content}</p>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Voting */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-full hover:bg-blue-50",
                                    userVote === "up" ? "text-[#00AEEF]" : "text-gray-500 hover:text-[#00AEEF]",
                                )}
                                onClick={handleUpvote}
                            >
                                <ArrowUp className="h-4 w-4" />
                                <span className="sr-only">Upvote</span>
                            </Button>

                            <span
                                className={cn(
                                    "text-sm font-medium",
                                    userVote === "up" ? "text-[#00AEEF]" : userVote === "down" ? "text-red-500" : "text-gray-600",
                                )}
                            >
                {upvotes}
              </span>

                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-full hover:bg-blue-50",
                                    userVote === "down" ? "text-red-500" : "text-gray-500 hover:text-red-500",
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
                            <span className="text-xs">{post.comments || 0}</span>
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
    )
}
