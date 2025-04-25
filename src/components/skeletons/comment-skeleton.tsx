"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommentSkeleton() {
  return (
    <motion.div
      className="bg-white rounded-lg border border-gray-100 overflow-hidden p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Author info */}
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-6 w-6 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 mb-3 pl-8">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pl-8">
        <div className="flex items-center gap-1">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-6" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-6" />
        </div>
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
    </motion.div>
  );
}
