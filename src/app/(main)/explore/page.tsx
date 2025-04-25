"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CommunityProvider } from "@/context/CommunityContext"
import CommunityList from "@/components/community-list"
import CreateCommunityForm from "@/components/create-community-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useAuth } from "@clerk/nextjs"

export default function ExplorePage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { isSignedIn } = useAuth()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <motion.h1
          className="text-2xl font-semibold text-gray-800"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Explore Communities
        </motion.h1>

        {isSignedIn && !showCreateForm && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#00AEEF] hover:bg-[#00AEEF]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Community
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-8">
          <CreateCommunityForm
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <CommunityProvider>
        <CommunityList emptyMessage="No communities found. Create one to get started!" />
      </CommunityProvider>
    </div>
  )
}
