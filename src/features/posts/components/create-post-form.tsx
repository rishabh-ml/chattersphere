// src/components/create-post-form.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Community } from "@/context/CommunityContext";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select";
import { usePosts } from "@/context/PostContext";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Loader2, Image } from "lucide-react";
import PostEditor from "./post-editor";
import MediaUploader from "@/features/posts/components/media-uploader";
import { toast } from "sonner";

interface CreatePostFormProps {
  communities?: Community[];
  onSuccess?: () => void;
}

export default function CreatePostForm({
                                         communities = [],
                                         onSuccess,
                                         startExpanded = false,
                                       }: CreatePostFormProps & { startExpanded?: boolean }) {
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { createPost, error } = usePosts();
  const { isSignedIn, userId } = useAuth();

  // Collapse editor when clicking outside if there's no content
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
          formRef.current &&
          !formRef.current.contains(e.target as Node) &&
          isExpanded &&
          !content.trim()
      ) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isExpanded, content]);

  // Reset state when collapsed
  useEffect(() => {
    if (!isExpanded) {
      setContent("");
      setCommunityId("personal");
      setMediaUrls([]);
      setShowMediaUploader(false);
    }
  }, [isExpanded]);
  // Handle media upload completion
  const handleMediaUpload = (url: string) => {
    setMediaUrls((prev) => [...prev, url]);
  };

  // Handle media files from MediaUploader
  const handleMediaChange = (files: any[]) => {
    // Extract URLs from the media files and add to mediaUrls
    const newUrls = files.map(file => file.url);
    setMediaUrls((prev) => [...prev, ...newUrls]);
  };

  // Handle media removal
  const handleRemoveMedia = (urlToRemove: string) => {
    setMediaUrls((prev) => prev.filter(url => url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast.error("Please sign in to create a post");
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      toast.error("Post content cannot be empty");
      return;
    }

    const MAX = 50000;
    if (trimmed.length > MAX) {
      toast.error(
          `Post too large (${trimmed.length.toLocaleString()} chars). Keep under ${MAX.toLocaleString()}.`
      );
      return;
    }

    if (trimmed.includes("<script") || trimmed.includes("javascript:")) {
      toast.error("Post contains potentially unsafe content");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log(`[CreatePostForm] Submitting post with userId: ${userId}, content length: ${trimmed.length}`);

      // Only pass communityId if it's not 'personal'
      const post = await createPost(
        trimmed,
        communityId !== 'personal' ? communityId : undefined,
        mediaUrls.length > 0 ? mediaUrls : undefined
      );

      if (!post) {
        if (error) {
          toast.error(`Error: ${error}`);
          console.error(`[CreatePostForm] Post creation failed with error: ${error}`);
        } else {
          toast.error("Unable to create post. Please try again.");
          console.error('[CreatePostForm] Post creation failed without specific error');
        }
        return;
      }

      console.log(`[CreatePostForm] Post created successfully with ID: ${post.id}`);
      toast.success("Post created successfully!");
      setIsExpanded(false);
      setContent("");
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(`[CreatePostForm] Exception during post creation: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return (
        <div className="bg-white rounded-lg border border-gray-100 p-4 mb-6 text-center">
          <p className="text-gray-600 mb-3">Sign in to create a post</p>
          <Button>Sign In</Button>
        </div>
    );
  }

  return (
      <motion.div
          ref={formRef}
          className="bg-white rounded-lg border border-gray-100 overflow-hidden mb-6 transition-shadow hover:shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleSubmit} className="p-4">
          <div
              className="relative cursor-text"
              onClick={() => !isExpanded && setIsExpanded(true)}
          >
            {isExpanded ? (
                <PostEditor
                    value={content}
                    onChangeAction={setContent}
                    placeholder="What's on your mind?"
                    minHeight="120px"
                />
            ) : (
                <div className="h-12 px-3 py-2 border border-gray-200 rounded-md text-gray-500 flex items-center">
                  What&#39;s on your mind?
                </div>
            )}

            <AnimatePresence>
              {isExpanded && (
                  <motion.button
                      type="button"
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10"
                      onClick={() => setIsExpanded(false)}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {isExpanded && (
                <motion.div
                    className="mt-4 space-y-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                >
                  {/* Media uploader toggle button */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMediaUploader(!showMediaUploader)}
                      className="flex items-center gap-2 text-gray-600"
                    >
                      <Image className="h-4 w-4" />
                      {showMediaUploader ? 'Hide media uploader' : 'Add image'}
                    </Button>
                  </div>                  {/* Media uploader */}
                  {showMediaUploader && (
                    <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                      <MediaUploader
                        onMediaChange={handleMediaChange}
                      />
                    </div>
                  )}

                  {/* Media previews */}
                  {mediaUrls.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Uploaded media:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {mediaUrls.map((url, index) => (
                          <div key={index} className="relative group rounded-md overflow-hidden border border-gray-200">
                            <img
                              src={url}
                              alt={`Uploaded media ${index + 1}`}
                              className="w-full h-24 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(url)}
                              className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Community selector and submit button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    {communities.length > 0 && (
                        <Select value={communityId} onValueChange={setCommunityId}>
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Select community" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Personal post</SelectItem>
                            {communities.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    )}

                    <Button
                        type="submit"
                        disabled={isSubmitting || !content.trim()}
                        className="w-full sm:w-auto bg-[#00AEEF] hover:bg-[#00AEEF]/90 text-white"
                    >
                      {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                      ) : (
                          <>
                            Post
                            <Send className="ml-2 h-4 w-4" />
                          </>
                      )}
                    </Button>
                  </div>
                </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
  );
}
