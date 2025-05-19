"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useNavigation, routes } from "@/lib/navigation";
import { Loader2 } from "lucide-react";

export default function CommunityRedirectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigation = useNavigation();

  useEffect(() => {
    // Redirect to the new community path
    if (slug) {
      navigation.goToCommunity(slug as string);
    }
  }, [slug, navigation]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00AEEF]" />
        <p className="text-gray-500">Redirecting to updated community page...</p>
      </div>
    </div>
  );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API response not OK: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Failed to fetch community: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Community data received:', data);

        if (!data.community) {
          throw new Error('Community data is missing in the response');
        }

        setCommunity(data.community);

        // Set initial membership status
        setMembershipStatus(data.community.isMember ? 'member' : 'none');

        // Fetch community posts
        await fetchCommunityPosts(data.community.id);

        // Fetch membership requests if moderator/creator
        if (data.community.isModerator || data.community.isCreator) {
          await fetchMembershipRequests(data.community.id);
        }
      } catch (error) {
        console.error("Error fetching community:", error);
        setError(error instanceof Error ? error.message : "Failed to load community. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCommunity();
    }
  }, [slug]);

  // Fetch membership requests (for moderators/creators)
  const fetchMembershipRequests = async (communityId: string) => {
    if (!community?.isModerator && !community?.isCreator) return;

    try {
      setLoadingRequests(true);
      const response = await fetch(`/api/communities/${communityId}/membership-requests`);

      if (!response.ok) {
        throw new Error("Failed to fetch membership requests");
      }

      const data = await response.json();
      setMembershipRequests(data.requests || []);
    } catch (error) {
      console.error("Error fetching membership requests:", error);
      toast.error("Failed to load membership requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  // Handle membership request approval/rejection
  const handleMembershipRequest = async (userId: string, action: 'approve' | 'reject') => {
    if (!community) return;

    try {
      const response = await fetch(`/api/communities/${community.id}/membership/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} membership request`);
      }

      // Remove the request from the list
      setMembershipRequests(prev => prev.filter(request => request.user.id !== userId));

      // Update member count if approved
      if (action === 'approve') {
        setCommunity(prev => {
          if (!prev) return null;
          return {
            ...prev,
            memberCount: prev.memberCount + 1,
          };
        });
      }

      toast.success(`Membership request ${action === 'approve' ? 'approved' : 'rejected'}`);
    } catch (error) {
      console.error(`Error ${action}ing membership request:`, error);
      toast.error(`Failed to ${action} membership request`);
    }
  };

  // Fetch community posts
  const fetchCommunityPosts = async (communityId: string) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/posts`);

      if (!response.ok) {
        throw new Error("Failed to fetch community posts");
      }

      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      toast.error("Failed to load community posts");
    }
  };

  // Handle join/leave community
  const handleMembershipToggle = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to join communities");
      return;
    }

    if (!community) return;

    setJoiningCommunity(true);

    try {
      const response = await fetch(`/api/communities/${community.id}/membership`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update membership");
      }

      const data = await response.json();

      // Handle different response types
      if (data.action === "request") {
        // Membership request submitted (requires approval)
        toast.success("Join request submitted for approval");
        // Update membership status to pending
        setMembershipStatus('pending');
      } else {
        // Regular join/leave action
        // Update local state
        setCommunity(prev => {
          if (!prev) return null;

          return {
            ...prev,
            isMember: data.isMember,
            memberCount: data.isMember ? prev.memberCount + 1 : prev.memberCount - 1,
          };
        });

        // Update membership status
        setMembershipStatus(data.isMember ? 'member' : 'none');
        toast.success(data.isMember ? "Joined community successfully" : "Left community successfully");
      }
    } catch (error) {
      console.error("Error updating membership:", error);
      toast.error("Failed to update community membership");
    } finally {
      setJoiningCommunity(false);
    }
  };

  // Handle post vote
  const handleVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();

      // Update local state
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                upvoteCount: data.voteStatus.upvoteCount,
                downvoteCount: data.voteStatus.downvoteCount,
                voteCount: data.voteStatus.voteCount,
                isUpvoted: data.voteStatus.isUpvoted,
                isDownvoted: data.voteStatus.isDownvoted,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to vote on post");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600 my-6">
        <p>{error || "Community not found"}</p>
        <Button asChild variant="outline" className="mt-4">
          <a href="/home">Go back to home</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Community Header */}
      <motion.div
        className="bg-white rounded-lg border border-gray-100 overflow-hidden mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Banner */}
        {community.banner && (
          <div className="h-40 w-full relative bg-gradient-to-r from-blue-400 to-indigo-500">
            <img
              src={community.banner}
              alt={`${community.name} banner`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Community Avatar */}
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

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-800">{community.name}</h1>
                  {community.isPrivate && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      Private
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">r/{community.slug}</p>
              </div>
            </div>

            <div className="md:ml-auto flex items-center gap-3 mt-4 md:mt-0">
              <Button
                variant={community.isMember || membershipStatus === 'pending' ? "outline" : "default"}
                className={(() => {
                  if (community.isMember) return "border-red-300 text-red-600 hover:bg-red-50";
                  if (membershipStatus === 'pending') return "border-yellow-300 text-yellow-600 hover:bg-yellow-50";
                  return "";
                })()}
                onClick={handleMembershipToggle}
                disabled={joiningCommunity || membershipStatus === 'pending'}
              >
                {joiningCommunity ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : membershipStatus === 'pending' ? (
                  <Loader2 className="h-4 w-4 mr-2" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                {community.isMember ? "Leave" : membershipStatus === 'pending' ? "Pending Approval" : "Join"}
              </Button>

              {(community.isCreator || community.isModerator) && (
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{community.memberCount} {community.memberCount === 1 ? "member" : "members"}</span>
            </div>

            {community.isCreator && (
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1 text-indigo-600" />
                <span className="text-indigo-600">Creator</span>
              </div>
            )}

            {community.isModerator && !community.isCreator && (
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1 text-green-600" />
                <span className="text-green-600">Moderator</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Community Content */}
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

        <TabsContent value="posts" className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
              <p className="text-gray-500">No posts in this community yet.</p>
              <Button className="mt-4">Create the first post</Button>
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} onVote={handleVote} />
            ))
          )}
        </TabsContent>

        <TabsContent value="about">
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2 text-indigo-600" />
              About {community.name}
            </h2>

            <p className="text-gray-700 whitespace-pre-wrap">{community.description}</p>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm font-medium">
                    {new Date(community.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Posts</p>
                  <p className="text-sm font-medium">{community.postCount}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Members</p>
                  <p className="text-sm font-medium">{community.memberCount}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Channels</p>
                  <p className="text-sm font-medium">{community.channelCount}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Members</h2>

            <p className="text-gray-500">
              This feature is coming soon. Check back later to see the members of this community.
            </p>
          </div>
        </TabsContent>

        {(community.isCreator || community.isModerator) && (
          <TabsContent value="requests">
            <div className="bg-white rounded-lg border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4">Membership Requests</h2>

              {loadingRequests ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : membershipRequests.length === 0 ? (
                <p className="text-gray-500 py-4">No pending membership requests.</p>
              ) : (
                <div className="space-y-4">
                  {membershipRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {request.user.image ? (
                            <img
                              src={request.user.image}
                              alt={request.user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-sm font-semibold">
                              {request.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.user.name}</p>
                          <p className="text-sm text-gray-500">@{request.user.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-600 hover:bg-green-50"
                          onClick={() => handleMembershipRequest(request.user.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => handleMembershipRequest(request.user.id, 'reject')}
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
