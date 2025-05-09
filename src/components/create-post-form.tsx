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
} from "@/components/ui/select";
import { usePosts } from "@/context/PostContext";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Loader2 } from "lucide-react";
import PostEditor from "./post-editor";
import { toast } from "sonner";

interface CreatePostFormProps {
  communities?: Community[];
  onSuccess?: () => void;
}

export default function CreatePostForm({
                                         communities = [],
                                         onSuccess,
                                       }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
      setCommunityId("");
    }
  }, [isExpanded]);

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

      const post = await createPost(trimmed, communityId || undefined);

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
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
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
                    className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                >
                  {communities.length > 0 && (
                      <Select value={communityId} onValueChange={setCommunityId}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Select community" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Personal post</SelectItem>
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
                </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
  );
}
