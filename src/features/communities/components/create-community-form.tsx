"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCommunities } from "@/context/CommunityContext";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface CreateCommunityFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateCommunityForm({ onSuccess, onCancel }: CreateCommunityFormProps) {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [image, setImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { createCommunity } = useCommunities();
  const { isSignedIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isSignedIn) {
      setError("You must be signed in to create a community");
      toast.error("You must be signed in to create a community");
      return;
    }

    if (!name.trim() || !description.trim()) {
      setError("Name and description are required");
      toast.error("Name and description are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const community = await createCommunity(
        name.trim(),
        description.trim(),
        image.trim() || undefined
      );

      if (community) {
        toast.success(`Community "${community.name}" created successfully!`);
        setName("");
        setDescription("");
        setImage("");
        onSuccess?.();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create community";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-6 text-center">
        <p className="text-gray-600 mb-3">Sign in to create a community</p>
        <Button>Sign In</Button>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Create a New Community</h2>
        {onCancel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div
            id="form-error"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Community Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a unique name for your community"
              required
              maxLength={50}
              className="w-full"
              aria-required={true}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "form-error" : undefined}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this community about?"
              required
              maxLength={500}
              className="w-full h-24"
              aria-required={true}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "form-error" : "description-hint"}
            />
            <p id="description-hint" className="mt-1 text-xs text-gray-500">
              {description.length}/500 characters
            </p>
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              Community Image URL (optional)
            </label>
            <Input
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full"
              aria-required={false}
              aria-describedby="image-hint"
            />
            <p id="image-hint" className="mt-1 text-xs text-gray-500">
              Enter a URL for your community image
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || name.trim() === "" || description.trim() === ""}
            className="bg-[#00AEEF] hover:bg-[#00AEEF]/90 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Community"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
