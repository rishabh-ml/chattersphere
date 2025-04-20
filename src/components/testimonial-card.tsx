"use client"

import { motion } from "framer-motion"
import { Quote } from "lucide-react"
import Image from "next/image"

interface TestimonialCardProps {
    quote: string
    name: string
    role: string
    avatar: string
}

export default function TestimonialCard({ quote, name, role, avatar }: TestimonialCardProps) {
    return (
        <motion.div
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03, rotateZ: -1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.5 }}
            viewport={{ once: true }}
        >
            <Quote className="h-8 w-8 text-blue-400/30 mb-4" />
            <p className="text-gray-600 mb-6 italic">&#34;{quote}&#34;</p>
            <div className="flex items-center">
                <Image
                    src={avatar || "/placeholder.svg"}
                    alt={name || "User Avatar"}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                    <h4 className="font-semibold text-[#111827]">{name}</h4>
                    <p className="text-gray-500 text-sm">{role}</p>
                </div>
            </div>
        </motion.div>
    )
}
