"use client";

import React, { useState, useRef, useEffect } from "react";
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
import DOMPurify from "isomorphic-dompurify";

interface CreatePostFormProps {
  communities?: Community[];
  onSuccess?: () => void;
}

export default function CreatePostForm({
  communities = [],
  onSuccess,
}: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { createPost } = usePosts();
  const { isSignedIn } = useAuth();

  // Collapse the editor if clicking outside and content is empty
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
          formRef.current &&
          !formRef.current.contains(e.target as Node) &&
          isExpanded &&
          !content.trim()
      ) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, content]);

  // Reset content and community when collapsed
  useEffect(() => {
    if (!isExpanded) {
      setContent("");
      setHtmlContent("");
      setCommunityId("");
    }
  }, [isExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast.error("Please sign in to create a post");
      return;
    }

    // Use the plain text content for validation
    const trimmedText = content.trim();
    if (!trimmedText) {
      toast.error("Post content cannot be empty");
      return;
    }

    const MAX_LENGTH = 50000;
    if (trimmedText.length > MAX_LENGTH) {
      toast.error(
        `Post is too large (${trimmedText.length.toLocaleString()} chars). Keep under ${MAX_LENGTH.toLocaleString()}.`
      );
      return;
    }

    // Sanitize HTML content before submission
    const sanitizedHtml = DOMPurify.sanitize(htmlContent);

    // Check for potentially unsafe content
    if (sanitizedHtml.includes("<script") || sanitizedHtml.includes("javascript:")) {
      toast.error("Post contains potentially unsafe content");
      return;
    }

    try {
      setIsSubmitting(true);
      const post = await createPost(sanitizedHtml, communityId || undefined);
      if (post) {
        toast.success("Post created successfully!");
        setIsExpanded(false);
        onSuccess?.();
      } else {
        toast.error("Failed to create post. Please try again.");
      }
    } catch (err) {
      console.error("Error creating post:", err);
      toast.error((err as Error).message || "Failed to create post");
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
                    value={htmlContent}
                    onChange={(html) => {
                      setHtmlContent(html);
                      // Extract plain text from HTML for validation
                      const tempDiv = document.createElement('div');
                      tempDiv.innerHTML = html;
                      setContent(tempDiv.textContent || tempDiv.innerText || '');
                    }}
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
                      <Select
                          value={communityId}
                          onValueChange={setCommunityId}
                          className="w-full sm:w-48"
                      >
                        <SelectTrigger>
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
