'use client';

import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { RightSidebar } from '@/components/right-sidebar';
import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';
import { Plus, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ToastProvider } from '@/components/providers/toast-provider';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Handle scroll events for "back to top" button with SSR guard
    useEffect(() => {
        // SSR guard - only run in browser environment
        if (typeof window === 'undefined') return;

        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 500);
        };

        // Initial check
        handleScroll();

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        // SSR guard
        if (typeof window === 'undefined') return;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <ClerkProvider>
            <ToastProvider />
            <div className="relative min-h-screen bg-[#f8fafc]">
                {/* Sidebar */}
                <Sidebar />

                {/* Main content area */}
                <div className="flex flex-col md:pl-64 min-h-screen">
                    {/* Topbar */}
                    <Topbar />

                    <div className="flex flex-1 overflow-x-hidden">
                        {/* Main Feed content */}
                        <main className="flex-1 overflow-y-auto p-4 md:p-6">
                            <div className="max-w-3xl mx-auto">
                                {children}
                            </div>
                        </main>

                        {/* Right Sidebar */}
                        <RightSidebar />
                    </div>
                </div>

                {/* Floating create post button */}
                <motion.div
                    className="fixed bottom-6 right-6 z-30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
                >
                    <Button
                        size="lg"
                        className="h-14 w-14 rounded-full shadow-lg bg-[#00AEEF] hover:bg-[#00AEEF]/90"
                    >
                        <Plus className="h-6 w-6 text-white" />
                        <span className="sr-only">Create new post</span>
                    </Button>
                </motion.div>

                {/* Scroll to top button */}
                <AnimatePresence>
                    {showScrollTop && (
                        <motion.div
                            className="fixed bottom-6 left-6 z-30"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <Button
                                size="icon"
                                variant="secondary"
                                onClick={scrollToTop}
                                className="h-10 w-10 rounded-full shadow-md bg-white hover:bg-gray-50 text-gray-600"
                            >
                                <ArrowUp className="h-5 w-5" />
                                <span className="sr-only">Back to top</span>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ClerkProvider>
    );
}
