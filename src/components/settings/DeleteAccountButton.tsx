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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

interface DeleteAccountButtonProps {
  userId: string;
  username: string;
  className?: string;
}

export default function DeleteAccountButton({
  userId,
  username,
  className = "",
}: DeleteAccountButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const router = useRouter();
  const { signOut } = useClerk();

  const handleDelete = async () => {
    if (confirmation !== username) {
      toast.error("Please enter your username correctly to confirm deletion");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete account");
      }

      toast.success("Account deleted successfully");

      // Sign out the user
      await signOut();

      // Redirect to the home page
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        className={`bg-red-500 hover:bg-red-600 ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Account
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">
                Are you sure you want to delete your account? This action cannot be undone and will:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-1">
                <li>Delete all your posts and comments</li>
                <li>Remove you from all communities</li>
                <li>Delete all your direct messages</li>
                <li>Remove all your saved items</li>
                <li>Delete your profile information</li>
              </ul>
              <p className="font-medium text-red-500 mb-4">
                This action is permanent and cannot be reversed.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type your username <strong>{username}</strong> to confirm:
                </label>
                <Input
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder={username}
                  className="mb-2"
                />
              </div>
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
              disabled={isDeleting || confirmation !== username}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
