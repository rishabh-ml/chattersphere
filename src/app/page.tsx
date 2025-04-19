'use client';
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import Testimonials from '@/components/Testimonials';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import About from '@/components/About';
import { ArrowUp } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

// Animation variants
const sectionVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8 } }
};

export default function Home() {
    const [showBackToTop, setShowBackToTop] = React.useState(false);
    const { theme } = useTheme();

    // Scroll watcher for back-to-top
    useEffect(() => {
        const handleScroll = () => setShowBackToTop(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () =>
        window.scrollTo({ top: 0, behavior: 'smooth' });

    // Section divider w/ wave SVG
    const SectionDivider = ({ inverted = false }: { inverted?: boolean }) => (
        <div className={`w-full h-24 overflow-hidden ${inverted ? 'rotate-180' : ''}`}>
            <svg
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                className="w-full h-full"
                fill={
                    inverted
                        ? theme === 'dark'
                            ? 'var(--card)'
                            : 'var(--background)'
                        : theme === 'dark'
                            ? 'var(--background)'
                            : 'var(--card)'
                }
            >
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
            </svg>
        </div>
    );

    return (
        <>
            <Navbar />

            <main className="bg-[var(--background)] text-[var(--foreground)]">
                <HeroSection />

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={sectionVariants}
                >
                    <About />
                </motion.div>

                <SectionDivider />

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                    className="bg-[var(--background)]"
                >
                    <FeaturesSection />
                </motion.div>

                <SectionDivider inverted />

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                >
                    <Testimonials />
                </motion.div>

                <SectionDivider />

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={sectionVariants}
                >
                    <Newsletter />
                </motion.div>
            </main>

            <Footer />

            {/* Back to top */}
            <motion.button
                onClick={scrollToTop}
                aria-label="Back to top"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: showBackToTop ? 1 : 0,
                    scale: showBackToTop ? 1 : 0.8,
                    pointerEvents: showBackToTop ? 'auto' : 'none'
                }}
                whileHover={{ y: -3 }}
                className="
          fixed bottom-8 right-8
          bg-[var(--primary)] hover:bg-[var(--secondary)]
          text-white dark:text-[var(--foreground)]
          rounded-full p-3 shadow-lg z-50
          transition-colors
        "
            >
                <ArrowUp size={24} />
            </motion.button>
        </>
    );
}
