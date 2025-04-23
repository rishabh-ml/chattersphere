"use client"

import { motion } from "framer-motion"
import { Construction, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface UnderDevelopmentProps {
  title: string
  description?: string
  showBackButton?: boolean
}

export function UnderDevelopment({ 
  title, 
  description = "You caught us red-handed! We're still working on this feature. Check back soon for updates.", 
  showBackButton = true 
}: UnderDevelopmentProps) {
  const router = useRouter()
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md"
      >
        <div className="mb-6 relative">
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 5,
              repeatType: "reverse"
            }}
            className="inline-block"
          >
            <Construction size={64} className="text-[#00AEEF] mx-auto" />
          </motion.div>
          <motion.div 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#EC4899] text-white text-xs flex items-center justify-center font-bold"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            !
          </motion.div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-3">{title}</h1>
        <p className="text-gray-600 mb-8">{description}</p>
        
        {showBackButton && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => router.back()}
              className="bg-[#00AEEF] hover:bg-[#00AEEF]/90 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
