"use client"

import type { LucideIcon } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { motion } from "framer-motion"

interface FeatureCardProps {
    icon: string
    title: string
    description: string
    color: string
}

export default function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
    // Dynamically get the icon from Lucide
    const IconComponent = LucideIcons[icon as keyof typeof LucideIcons] as LucideIcon

    return (
        <motion.div
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: `${color}20` }}
            >
                {IconComponent && <IconComponent className="h-6 w-6" style={{ color }} />}
            </div>
            <h3 className="text-xl font-semibold text-[#111827] mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </motion.div>
    )
}
