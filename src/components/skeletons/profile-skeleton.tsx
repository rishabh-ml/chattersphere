"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSkeleton() {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full mx-auto md:mx-0" />
          <div className="flex-1 space-y-4 text-center md:text-left">
            <Skeleton className="h-7 w-48 mx-auto md:mx-0" />
            <Skeleton className="h-5 w-32 mx-auto md:mx-0" />
            <Skeleton className="h-4 w-full max-w-md mx-auto md:mx-0" />
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>

      {/* Content */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </motion.div>
  );
}
