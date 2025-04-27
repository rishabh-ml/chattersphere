"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Share2, MessageCircle, User, Users, Info, GridIcon, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicUser {
    id: string;
    username: string;
    name: string;
    image?: string;
    followerCount: number;
    followingCount: number;
    communityCount: number;
    joinedDate: string;
    isFollowing: boolean;
}

export default function PublicProfilePage() {
    const { userId } = useParams<{ userId: string }>();
    const router = useRouter();
    const [user, setUser] = useState<PublicUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`/api/users/${userId}`);
                if (!res.ok) throw new Error("Failed to fetch user profile");
                const data = await res.json();
                setUser(data.user);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUser();
        }
    }, [userId]);

    const handleFollowToggle = async () => {
        if (!user) return;
        try {
            setFollowLoading(true);
            const res = await fetch(`/api/users/${user.id}/follow`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to update follow status");
            const data = await res.json();
            setUser((prev) => prev && { ...prev, isFollowing: data.isFollowing, followerCount: data.followerCount });
        } catch (err) {
            console.error("Follow error:", err);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <Skeleton className="h-48 w-full rounded-lg mb-[-48px]" />
                <div className="relative px-6 pb-6 pt-12 flex flex-col md:flex-row gap-6">
                    <Skeleton className="h-28 w-28 rounded-full border-4 border-white" />
                    <div className="flex-1 mt-12 md:mt-0 md:ml-32">
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-5 w-32 mb-4" />
                        <Skeleton className="h-4 w-full max-w-md mb-2" />
                        <Skeleton className="h-4 w-3/4 max-w-md" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="max-w-2xl mx-auto p-6 text-center">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-8">
                    <h2 className="text-xl font-semibold text-amber-800">Profile Not Found</h2>
                    <p className="text-sm text-amber-600 mt-2">{error ?? "This user does not exist or has been removed."}</p>
                    <Button variant="outline" className="mt-4 border-amber-300 text-amber-800 hover:bg-amber-100" onClick={() => router.back()}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto pb-12">
            {/* Profile Banner */}
            <div className="relative h-64 w-full bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-400 rounded-b-lg overflow-hidden" />

            {/* Profile Header */}
            <div className="relative px-6">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="relative mt-[-64px]">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                        {user.image ? (
                            <AvatarImage src={user.image} alt={user.name} />
                        ) : (
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-4xl">
                                {user.name.charAt(0)}
                            </AvatarFallback>
                        )}
                    </Avatar>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                            <p className="text-gray-500 flex items-center gap-1">
                                <span>@{user.username}</span>
                                <span className="text-gray-300 px-1">•</span>
                                <span className="text-sm flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {user.joinedDate ? format(new Date(user.joinedDate), 'MMM yyyy') : 'recently'}
                </span>
                            </p>
                        </div>

                        <div className="flex gap-2 mt-4 md:mt-0">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" className="rounded-full">
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Share profile</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Button
                                disabled={followLoading}
                                onClick={handleFollowToggle}
                                className={user.isFollowing ? "bg-gray-200 text-gray-600" : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"}
                            >
                                {user.isFollowing ? "Unfollow" : "Follow"}
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-6 mt-6">
                        <Badge variant="secondary" className="px-4 py-2 rounded-full">
                            <User className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                            <span className="font-semibold text-indigo-700">{user.followerCount}</span> Followers
                        </Badge>
                        <Badge variant="secondary" className="px-4 py-2 rounded-full">
                            <User className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                            <span className="font-semibold text-indigo-700">{user.followingCount}</span> Following
                        </Badge>
                        <Badge variant="secondary" className="px-4 py-2 rounded-full">
                            <Users className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                            <span className="font-semibold text-indigo-700">{user.communityCount}</span> Communities
                        </Badge>
                    </div>
                </motion.div>
            </div>

            {/* Tabs */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 px-6">
                <Tabs defaultValue="about">
                    <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
                        <TabsTrigger value="about" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                            <Info className="h-4 w-4 mr-2" /> About
                        </TabsTrigger>
                        <TabsTrigger value="posts" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                            <GridIcon className="h-4 w-4 mr-2" /> Posts
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="about" className="mt-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-2">Profile Info</h2>
                            <p><strong>Username:</strong> @{user.username}</p>
                            <p><strong>Joined:</strong> {format(new Date(user.joinedDate), 'MMMM d, yyyy')}</p>
                            <p><strong>Bio:</strong> No bio yet.</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="posts" className="mt-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm text-center text-gray-500">
                            No posts available yet.
                        </div>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </motion.div>
    );
}
