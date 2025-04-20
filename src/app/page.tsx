"use client"

import { ArrowRight, Play, Users, MessageSquare, Globe,  } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Header from "../components/header"
import FeatureCard from "../components/feature-card"
import StepCard from "../components/step-card"
import CommunityCard from "../components/community-card"
import TestimonialCard from "../components/testimonial-card"
import {SignUpButton, useAuth} from "@clerk/nextjs";
import Image from "next/image";
import NewsletterSection from "@/components/Newsletter";

export default function Home() {
    useAuth()

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Header />

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 md:py-32">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <motion.h1
                            className="text-4xl md:text-6xl font-bold text-[#111827] mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            Where <span className="text-[#38BDF8]">Conversations</span> Come{" "}
                            <span className="text-[#EC4899]">Alive</span>
                        </motion.h1>
                        <motion.p
                            className="text-lg text-gray-600 mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            ChatterSphere connects you with communities that share your passions. Join meaningful conversations, make
                            new friends, and discover content that matters to you.
                        </motion.p>
                        <motion.div
                            className="flex flex-wrap gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <SignUpButton>
                                <Button className="bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-white px-8 py-6 rounded-xl">
                                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </SignUpButton>
                            <Button
                                variant="outline"
                                className="border-[#EC4899] text-[#EC4899] hover:bg-[#EC4899]/10 px-8 py-6 rounded-xl"
                            >
                                Watch Demo <Play className="ml-2 h-4 w-4" />
                            </Button>
                        </motion.div>
                    </div>
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Image
                            src="/conversations-illustration.svg"
                            alt="ChatterSphere Illustration"
                            width={600}
                            height={500}
                            className="w-full h-auto rounded-2xl shadow-lg"
                        />
                    </motion.div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                    {[
                        { icon: <Users className="h-8 w-8 text-[#38BDF8]" />, value: "2M+", label: "Active Users" },
                        { icon: <MessageSquare className="h-8 w-8 text-[#EC4899]" />, value: "10M+", label: "Daily Messages" },
                        { icon: <Globe className="h-8 w-8 text-[#38BDF8]" />, value: "50K+", label: "Communities" },
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                        >
                            {stat.icon}
                            <div>
                                <h3 className="text-2xl font-bold text-[#111827]">{stat.value}</h3>
                                <p className="text-gray-500">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-white py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">Why Choose ChatterSphere?</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Our platform is designed to make connecting with like-minded people seamless and enjoyable.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard
                            icon="MessageCircle"
                            title="Real-Time Chat"
                            description="Connect instantly with friends and communities through our lightning-fast messaging system."
                            color="#38BDF8"
                        />
                        <FeatureCard
                            icon="Users"
                            title="Join Communities"
                            description="Find and join communities based on your interests, hobbies, and passions."
                            color="#EC4899"
                        />
                        <FeatureCard
                            icon="TrendingUp"
                            title="Trending Discussions"
                            description="Stay updated with the hottest topics and conversations happening right now."
                            color="#38BDF8"
                        />
                        <FeatureCard
                            icon="Globe"
                            title="Global Reach"
                            description="Connect with people from all around the world and expand your horizons."
                            color="#EC4899"
                        />
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="container mx-auto px-4 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">How It Works</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Getting started with ChatterSphere is easy. Follow these simple steps to join the conversation.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <StepCard
                        number={1}
                        title="Create Your Profile"
                        description="Sign up and customize your profile to showcase your interests and personality."
                    />
                    <StepCard
                        number={2}
                        title="Join Communities"
                        description="Discover and join communities that align with your passions and interests."
                    />
                    <StepCard
                        number={3}
                        title="Start Chatting"
                        description="Engage in meaningful conversations and connect with like-minded individuals."
                    />
                </div>
            </section>

            {/* Community Preview Section */}
            <section className="bg-gradient-to-r from-[#38BDF8]/10 to-[#EC4899]/10 py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">Popular Communities</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Join these thriving communities and start connecting with people who share your interests.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <CommunityCard
                            icon="Code"
                            name="Techies"
                            members="450K+"
                            description="For tech enthusiasts, developers, and innovators to discuss the latest in technology."
                            color="#38BDF8"
                        />
                        <CommunityCard
                            icon="Music"
                            name="Music Lovers"
                            members="320K+"
                            description="Share your favorite tunes, discover new artists, and connect with fellow music enthusiasts."
                            color="#EC4899"
                        />
                        <CommunityCard
                            icon="BookOpen"
                            name="Book Clubs"
                            members="280K+"
                            description="Discuss your favorite books, authors, and literary genres with passionate readers."
                            color="#38BDF8"
                        />
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="container mx-auto px-4 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">What Our Users Say</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Don&apos;t just take our word for it. Here&apos;s what our community members have to say about ChatterSphere.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <TestimonialCard
                        quote="ChatterSphere has completely changed how I connect with people who share my interests. The communities are vibrant and welcoming!"
                        name="Alex Johnson"
                        role="Tech Community Member"
                        avatar="/avatars/alex.png?height=80&width=80"
                    />
                    <TestimonialCard
                        quote="I've made so many meaningful connections through ChatterSphere. The platform is intuitive and the conversations are always engaging."
                        name="Samantha Lee"
                        role="Music Community Leader"
                        avatar="/avatars/sarah.png?height=80&width=80"
                    />
                    <TestimonialCard
                        quote="As someone who loves books, finding ChatterSphere's literary communities has been a game-changer. I've discovered so many great reads!"
                        name="Michael Chen"
                        role="Book Club Organizer"
                        avatar="/avatars/miguel.png?height=80&width=80"
                    />
                </div>
            </section>

            <NewsletterSection />

            {/* Footer */}
            <footer className="bg-[#0F172A] text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4">ChatterSphere</h3>
                            <p className="text-gray-400">Where conversations come alive and communities thrive.</p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                {["Features", "How It Works", "Community", "Testimonials"].map((link) => (
                                    <li key={link}>
                                        <a href="#" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2">
                                {["Privacy Policy", "Terms of Service", "Cookie Policy", "Contact Us"].map((link) => (
                                    <li key={link}>
                                        <a href="#" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
<div className="flex space-x-4">
    {["Facebook", "Twitter", "Instagram", "Linkedin"].map((social) => (
        <a key={social} href="#" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
            <span className="sr-only">{social}</span>
            {social === "Facebook" && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" /></svg>}
            {social === "Twitter" && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>}
            {social === "Instagram" && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 4c-2.474 0-2.878.007-4.029.058-.784.037-1.31.142-1.798.332-.434.168-.747.369-1.08.703a2.89 2.89 0 0 0-.704 1.08c-.19.49-.295 1.015-.331 1.798C4.006 9.075 4 9.461 4 12c0 2.474.007 2.878.058 4.029.037.783.142 1.31.331 1.797.17.435.37.748.702 1.08.337.336.65.537 1.08.703.494.191 1.02.297 1.8.333C9.075 19.994 9.461 20 12 20c2.474 0 2.878-.007 4.029-.058.782-.037 1.309-.142 1.797-.331.433-.169.748-.37 1.08-.702.337-.337.538-.65.704-1.08.19-.493.296-1.02.332-1.8.052-1.104.058-1.49.058-4.029 0-2.474-.007-2.878-.058-4.029-.037-.782-.142-1.31-.332-1.798a2.911 2.911 0 0 0-.703-1.08 2.884 2.884 0 0 0-1.08-.704c-.49-.19-1.016-.295-1.798-.331C14.925 4.006 14.539 4 12 4zm0-2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2z" /></svg>}
            {social === "Linkedin" && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" /></svg>}
        </a>
    ))}
</div>
</div>
<div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
    <p>© {new Date().getFullYear()} ChatterSphere. All rights reserved.</p>
</div>
</div>
</div>
</footer>
</div>
)
}