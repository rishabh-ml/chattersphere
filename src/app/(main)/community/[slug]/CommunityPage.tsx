"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2, Users, Info, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PostCard from "@/components/post-card";
import { toast } from "react-hot-toast";

interface Community {
  id: string;
  name: string;
  slug: string;
  banner?: string;
  image?: string;
  description?: string;
  createdAt: string;
  postCount: number;
  memberCount: number;
  channelCount: number;
  isPrivate: boolean;
  isMember: boolean;
  isCreator: boolean;
  isModerator: boolean;
}

interface Post {
  id: string;
  upvoteCount: number;
  downvoteCount: number;
  voteCount: number;
  isUpvoted: boolean;
  isDownvoted: boolean;
  author: {
    id: string;
    name: string;
    username: string;
    image?: string;
  };
  content: string;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  title?: string;
  community?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface MembershipRequest {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    image?: string;
  };
}

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isSignedIn } = useUser();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [joiningCommunity, setJoiningCommunity] = useState<boolean>(false);
  const [membershipStatus, setMembershipStatus] = useState<"member" | "none" | "pending">("none");
  const [activeTab, setActiveTab] = useState<string>("posts");

  // Fetch community details
  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/communities/${slug}`);
        if (!res.ok) {
          const text = await res.text();
          console.error(`Error ${res.status}:`, text);
          throw new Error(`Failed to fetch community`);
        }
        const { community: data } = await res.json();
        if (!data) throw new Error("Missing community data");
        setCommunity(data);
        setMembershipStatus(data.isMember ? "member" : "none");

        await fetchCommunityPosts(data.id);
        if (data.isModerator || data.isCreator) {
          await fetchMembershipRequests(data.id);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load community");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchCommunity();
  }, [slug]);

  // Fetch posts
  const fetchCommunityPosts = async (communityId: string) => {
    try {
      const res = await fetch(`/api/communities/${communityId}/posts`);
      if (!res.ok) throw new Error("Failed to load posts");
      const { posts: data } = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load posts");
    }
  };

  // Fetch pending membership requests
  const fetchMembershipRequests = async (communityId: string) => {
    if (!community?.isModerator && !community?.isCreator) return;
    try {
      setLoadingRequests(true);
      const res = await fetch(`/api/communities/${communityId}/membership-requests`);
      if (!res.ok) throw new Error("Failed to load requests");
      const { requests } = await res.json();
      setMembershipRequests(requests || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load membership requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  // Handle approve/reject
  const handleMembershipRequest = async (userId: string, action: "approve" | "reject") => {
    if (!community) return;
    try {
      const res = await fetch(`/api/communities/${community.id}/membership/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} request`);

      // Remove the request from UI
      setMembershipRequests((prev) => prev.filter((req) => req.user.id !== userId));

      if (action === "approve") {
        // Update community state
        setCommunity((prev) =>
          prev
            ? {
                ...prev,
                isMember: true,
                memberCount: prev.memberCount + 1,
              }
            : prev
        );
        setMembershipStatus("member");
        toast.success("Membership request approved");
      } else {
        setMembershipStatus("none");
        toast.success("Membership request rejected");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${action} membership request`);
    }
  };

  // Join/leave
  const handleMembershipToggle = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to join");
      return;
    }
    if (!community) return;

    setJoiningCommunity(true);
    try {
      const res = await fetch(`/api/communities/${community.id}/membership`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to update membership");
      const data = await res.json();

      if (data.action === "request") {
        toast.success("Join request submitted");
        setMembershipStatus("pending");
      } else {
        setCommunity((prev) =>
          prev
            ? {
                ...prev,
                isMember: data.isMember,
                memberCount: data.memberCount,
              }
            : prev
        );
        setMembershipStatus(data.isMember ? "member" : "none");
        toast.success(data.isMember ? "Joined" : "Left");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update membership");
    } finally {
      setJoiningCommunity(false);
    }
  };

  // Vote handler (unchanged)
  const handleVote = async (postId: string, voteType: "upvote" | "downvote") => {
    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });
      if (!res.ok) throw new Error("Vote failed");
      const { voteStatus } = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...voteStatus } : p)));
    } catch (err) {
      console.error(err);
      toast.error("Failed to vote");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }
  if (error || !community) {
    return (
      <div className="bg-red-50 border-red-200 border rounded-lg p-6 text-red-600 my-6">
        <p>{error || "Community not found"}</p>
        <Button asChild variant="outline" className="mt-4">
          <a href="/home">Go home</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        className="bg-white rounded-lg border border-gray-100 overflow-hidden mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {community.banner && (
          <div className="h-40 w-full bg-gradient-to-r from-blue-400 to-indigo-500">
            <img
              src={community.banner}
              alt={`${community.name} banner`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-white shadow-sm">
            {community.image ? (
              <img
                src={community.image}
                alt={community.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-xl font-semibold">
                {community.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">
              {community.name}{" "}
              {community.isPrivate && (
                <Badge variant="outline" className="bg-gray-100 text-gray-600">
                  Private
                </Badge>
              )}
            </h1>
            <p className="text-sm text-gray-500">r/{community.slug}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant={community.isMember || membershipStatus === "pending" ? "outline" : "default"}
              onClick={handleMembershipToggle}
              disabled={joiningCommunity || membershipStatus === "pending"}
            >
              {joiningCommunity ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : membershipStatus === "pending" ? (
                <Loader2 className="h-4 w-4 mr-2" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              {community.isMember ? "Leave" : membershipStatus === "pending" ? "Pending" : "Join"}
            </Button>
            {(community.isCreator || community.isModerator) && (
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          {(community.isCreator || community.isModerator) && (
            <TabsTrigger value="requests">
              Requests
              {membershipRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {membershipRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
              <p className="text-gray-500">No posts yet.</p>
              <Button className="mt-4">Create Post</Button>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} onVote={handleVote} />)
          )}
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2 text-indigo-600" />
              About {community.name}
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{community.description}</p>
            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <p>Created</p>
                <p className="font-medium">{new Date(community.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p>Posts</p>
                <p className="font-medium">{community.postCount}</p>
              </div>
              <div>
                <p>Members</p>
                <p className="font-medium">{community.memberCount}</p>
              </div>
              <div>
                <p>Channels</p>
                <p className="font-medium">{community.channelCount}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Members</h2>
            <p className="text-gray-500">Coming soon.</p>
          </div>
        </TabsContent>

        {/* Requests Tab */}
        {(community.isCreator || community.isModerator) && (
          <TabsContent value="requests">
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4">Membership Requests</h2>
              {loadingRequests ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : membershipRequests.length === 0 ? (
                <p className="text-gray-500 py-4">No pending requests.</p>
              ) : (
                <div className="space-y-4">
                  {membershipRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between border-b border-gray-100 pb-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {req.user.image ? (
                            <img
                              src={req.user.image}
                              alt={req.user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-sm font-semibold">
                              {req.user.name[0].toUpperCase()}
                            </div>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{req.user.name}</p>
                          <p className="text-sm text-gray-500">@{req.user.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-600 hover:bg-green-50"
                          onClick={() => handleMembershipRequest(req.user.id, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => handleMembershipRequest(req.user.id, "reject")}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
