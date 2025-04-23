"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { motion } from "framer-motion"
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { isSignedIn } = useAuth()
    const router = useRouter()

    const navLinks = ["Features", "How It Works", "Community", "Testimonials", "About Devs"]

    const handleSignIn = () => {
        if (isSignedIn) {
            // If user is already signed in, redirect to home page
            router.push('/home')
            return
        }
    }

    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex items-center">
                        <a href="#" className="flex items-center">
                            <span className="text-2xl font-bold text-[#111827]">
                                <span className="text-[#38BDF8]">Chatter</span>
                                <span className="text-[#EC4899]">Sphere</span>
                            </span>
                        </a>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link, index) => (
                            <Link
                                key={index}
                                href={link === "Features" ? "/#features" :
                                     link === "How It Works" ? "/#how-it-works" :
                                     link === "Community" ? "/#community" :
                                     link === "Testimonials" ? "/#testimonials" :
                                     link === "About Devs" ? "/about-developers" : "/#"}
                                className={`text-gray-600 hover:text-[#38BDF8] transition-colors ${
                                    link === "About Devs" ? "text-[#EC4899] font-medium" : ""
                                }`}
                            >
                                {link}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Auth Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isSignedIn ? (
                            <Button
                                variant="outline"
                                className="border-[#38BDF8] text-[#38BDF8] hover:bg-[#38BDF8]/10"
                                onClick={() => router.push('/home')}
                            >
                                Go to Home
                            </Button>
                        ) : (
                            <SignInButton mode="modal">
                                <Button
                                    variant="outline"
                                    className="border-[#38BDF8] text-[#38BDF8] hover:bg-[#38BDF8]/10"
                                    onClick={handleSignIn}
                                >
                                    Log In
                                </Button>
                            </SignInButton>
                        )}
                        {!isSignedIn && (
                            <SignUpButton mode="modal">
                                <Button
                                    className="bg-[#EC4899] hover:bg-[#EC4899]/90 text-white"
                                    onClick={() => router.push('/home')}
                                >
                                    Sign Up
                                </Button>
                            </SignUpButton>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <motion.div
                    className="md:hidden bg-white border-t border-gray-200"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="container mx-auto px-4 py-4">
                        <nav className="flex flex-col space-y-4">
                            {navLinks.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link === "Features" ? "/#features" :
                                         link === "How It Works" ? "/#how-it-works" :
                                         link === "Community" ? "/#community" :
                                         link === "Testimonials" ? "/#testimonials" :
                                         link === "About Devs" ? "/about-developers" : "/#"}
                                    className={`text-gray-600 hover:text-[#38BDF8] transition-colors py-2 ${
                                        link === "About Devs" ? "text-[#EC4899] font-medium" : ""
                                    }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link}
                                </Link>
                            ))}
                        </nav>
                        {/* Mobile Menu Auth Buttons */}
                        <div className="flex flex-col space-y-3 mt-6">
                            {isSignedIn ? (
                                <Button
                                    variant="outline"
                                    className="border-[#38BDF8] text-[#38BDF8] hover:bg-[#38BDF8]/10 w-full"
                                    onClick={() => router.push('/home')}
                                >
                                    Go to Home
                                </Button>
                            ) : (
                                <>
                                    <SignInButton mode="modal">
                                        <Button
                                            variant="outline"
                                            className="border-[#38BDF8] text-[#38BDF8] hover:bg-[#38BDF8]/10 w-full"
                                            onClick={handleSignIn}
                                        >
                                            Log In
                                        </Button>
                                    </SignInButton>
                                    <SignUpButton mode="modal">
                                        <Button
                                            className="bg-[#EC4899] hover:bg-[#EC4899]/90 text-white w-full"
                                            onClick={() => router.push('/home')}
                                        >
                                            Sign Up
                                        </Button>
                                    </SignUpButton>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </header>
    )
}