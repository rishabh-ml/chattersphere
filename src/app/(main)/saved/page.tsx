"use client"

import { motion } from "framer-motion"
import { SavedPostProvider } from "@/context/SavedPostContext"
import { Bookmark } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import SavedPostFeed from "@/components/saved-post-feed"

export default function SavedPage() {
  const { isSignedIn } = useUser()

  return (
    <div className="space-y-6">
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Bookmark className="h-6 w-6 text-[#00AEEF]" />
        <h1 className="text-2xl font-semibold text-gray-800">Saved Posts</h1>
      </motion.div>

      <SavedPostProvider>
        <SavedPostFeed
          emptyMessage={isSignedIn ?
            "You haven't saved any posts yet. Save posts to view them here!" :
            "Sign in to see your saved posts!"}
        />
      </SavedPostProvider>
    </div>
  )
}
