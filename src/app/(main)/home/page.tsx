"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import Feed from "@/app/(main)/home/Feed"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Clock, Filter } from "lucide-react"
import { motion } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Home() {
  const { isSignedIn, user } = useUser()
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState("popular")

  return (
    <div className="space-y-6">
      {/* Header with welcome message if signed in */}
      <div className="mb-6">
        {isSignedIn ? (
          <motion.h1
            className="text-2xl font-semibold text-gray-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            Welcome back, {user?.firstName || 'there'}! 👋
          </motion.h1>
        ) : (
          <h1 className="text-2xl font-semibold text-gray-800">
            Explore the community
          </h1>
        )}
      </div>

      {/* Feed Filters and Tabs */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all" aria-selected={activeTab === "all"}>All</TabsTrigger>
              {isSignedIn && (
                <TabsTrigger value="my-communities" aria-selected={activeTab === "my-communities"}>
                  My Communities
                </TabsTrigger>
              )}
              {isSignedIn ? (
                <TabsTrigger value="saved" aria-selected={activeTab === "saved"}>Saved</TabsTrigger>
              ) : (
                <TabsTrigger value="trending" aria-selected={activeTab === "trending"}>Trending</TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-[#00AEEF] transition-colors"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {sortBy === "popular" ? "Popular" : "Newest"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <button
                    onClick={() => setSortBy("popular")}
                    className="flex items-center w-full"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Popular
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <button
                    onClick={() => setSortBy("newest")}
                    className="flex items-center w-full"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Newest
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <Feed />
    </div>
  )
}