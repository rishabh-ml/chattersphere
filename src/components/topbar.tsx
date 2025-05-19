"use client"

import { Search, PlusCircle, Menu, MessageSquare } from "lucide-react"
import ProfileDropdown from "./ProfileDropdown"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import NotificationBell from "./notifications/NotificationBell"
import { useCreatePostModal } from "@/context/CreatePostModalContext"


export function Topbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [searchFocused, setSearchFocused] = useState(false)
    const router = useRouter()
    const { user, isSignedIn } = useUser()
    const { openModal } = useCreatePostModal()

    // Handle scroll events for shadow effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <motion.div
            className={`sticky top-0 z-10 h-16 border-b border-gray-100 bg-white px-4 flex items-center justify-between transition-shadow ${isScrolled ? 'shadow-sm' : ''}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Mobile Menu Button and Logo */}
            <div className="flex md:hidden items-center gap-3">
                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-[#00AEEF] hover:bg-blue-50">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                </Button>

                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#00AEEF] to-[#EC4899] flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-sm">CS</span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center max-w-md w-full mx-auto relative">
                <Search className={`absolute left-3 h-4 w-4 text-gray-400 transition-colors ${searchFocused ? 'text-[#00AEEF]' : ''}`} />
                <Input
                    placeholder="Search ChatterSphere"
                    className="pl-10 bg-gray-50 border-gray-200 focus-visible:ring-[#00AEEF]/30 focus-visible:ring-offset-0 focus-visible:border-[#00AEEF] transition-all"
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <NotificationBell />

                <div className="relative hidden md:block">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-gray-600 hover:text-[#00AEEF] hover:bg-blue-50 transition-colors"
                    >
                        <MessageSquare className="h-5 w-5" />
                        <span className="sr-only">Messages</span>
                    </Button>
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="hidden md:flex items-center gap-1 text-gray-600 hover:text-[#00AEEF] hover:bg-blue-50 transition-colors"
                    onClick={openModal}
                >
                    <PlusCircle className="h-4 w-4" />
                    <span>New Post</span>
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden rounded-full text-gray-600 hover:text-[#00AEEF] hover:bg-blue-50 transition-colors"
                    onClick={openModal}
                >
                    <PlusCircle className="h-5 w-5" />
                    <span className="sr-only">New Post</span>
                </Button>

                {/* User Profile Dropdown */}
                <ProfileDropdown />
            </div>
        </motion.div>
    )
}