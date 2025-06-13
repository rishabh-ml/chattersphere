"use client"

import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

interface LandingCommunityCardProps {
    icon: string
    name: string
    members: string
    description: string
    color: string
}

export default function LandingCommunityCard({ icon, name, members, description, color }: LandingCommunityCardProps) {
    // Dynamically get the icon from Lucide
    const IconComponent = LucideIcons[icon as keyof typeof LucideIcons] as LucideIcon

    return (
        <motion.div
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center mb-4">
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-opacity-20`}
                    style={{ backgroundColor: color }}
                >
                    {IconComponent && <IconComponent className={`h-6 w-6`} style={{ color }} />}
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-[#111827]">{name}</h3>
                    <p className="text-gray-500 text-sm">{members} members</p>
                </div>
            </div>
            <p className="text-gray-600 mb-4">{description}</p>
            <button
                className={`text-sm font-medium hover:underline transition-colors`}
                style={{ color }}
            >
                Join Community →
            </button>
        </motion.div>
    )
}
