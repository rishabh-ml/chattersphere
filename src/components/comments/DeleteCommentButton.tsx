"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteCommentButtonProps {
  commentId: string;
  authorId: string;
  currentUserId: string;
  userRole?: string;
  className?: string;
  variant?: "icon" | "text" | "destructive";
  size?: "sm" | "default";
  onDeleted?: () => void;
}

export default function DeleteCommentButton({
  commentId,
  authorId,
  currentUserId,
  userRole,
  className = "",
  variant = "icon",
  size = "default",
  onDeleted,
}: DeleteCommentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Check if the current user can delete this comment
  const canDelete =
    currentUserId === authorId || userRole === "ADMIN" || userRole === "MODERATOR";

  if (!canDelete) {
    return null;
  }

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete comment");
      }

      toast.success("Comment deleted successfully");
      
      // Call the onDeleted callback if provided
      if (onDeleted) {
        onDeleted();
      } else {
        // Otherwise, refresh the page
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete comment");
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      {variant === "icon" && (
        <Button
          variant="ghost"
          size={size}
          className={`text-gray-500 hover:text-red-500 hover:bg-red-50 ${className}`}
          onClick={() => setIsOpen(true)}
        >
          <Trash2 className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
      )}

      {variant === "text" && (
        <Button
          variant="ghost"
          size={size}
          className={`text-gray-500 hover:text-red-500 hover:bg-red-50 ${className}`}
          onClick={() => setIsOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}

      {variant === "destructive" && (
        <Button
          variant="destructive"
          size={size}
          className={className}
          onClick={() => setIsOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Comment
        </Button>
      )}

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
              {currentUserId !== authorId && (
                <p className="mt-2 text-amber-600 font-medium">
                  You are deleting this comment as a {userRole?.toLowerCase()}.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
