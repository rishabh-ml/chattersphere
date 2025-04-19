'use client';
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { FiUsers, FiMessageCircle, FiTrendingUp } from 'react-icons/fi';

const HeroSection: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) gsap.from(ref.current, { opacity: 0, y: 40, duration: 1 });
    }, []);

    const stats = [
        { icon: <FiUsers size={18} />, value: '10M+', label: 'Users' },
        { icon: <FiMessageCircle size={18} />, value: '500K+', label: 'Daily Messages' },
        { icon: <FiTrendingUp size={18} />, value: '50K+', label: 'Communities' }
    ];

    return (
        <section
            ref={ref}
            id="home"
            className="
        flex flex-col-reverse md:flex-row items-center
        px-6 md:px-16 py-24 md:py-32
        bg-[var(--background)] text-[var(--foreground)]
      "
        >
            {/* Text Content */}
            <div className="md:w-1/2 space-y-6 pt-10 md:pt-0">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="
            inline-block
            bg-[var(--primary)]/10 text-[var(--primary)]
            px-4 py-1 rounded-full
            text-sm font-semibold
          "
                >
                    Connect. Share. Thrive.
                </motion.div>

                <motion.h1
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="
            text-4xl md:text-6xl font-bold
            text-[var(--foreground)] leading-tight
          "
                >
                    Where Conversations <span className="text-[var(--primary)]">Come Alive</span>
                </motion.h1>

                <motion.p
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-lg text-[var(--muted)] max-w-md"
                >
                    Join ChatterSphere to connect with communities, share ideas, and spark meaningful conversations in a space designed for authentic engagement.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <button
                        id="get-started"
                        className="
              bg-[var(--primary)] hover:bg-[var(--secondary)]
              text-[var(--background)]
              font-semibold py-3 px-8
              rounded-lg transition-all duration-300
            "
                    >
                        Get Started
                    </button>
                    <button
                        className="
              border border-[var(--card-border)]
              hover:border-[var(--primary)]
              text-[var(--foreground)]
              font-semibold py-3 px-8
              rounded-lg transition-all duration-300
              hover:bg-[var(--card)]
            "
                    >
                        Watch Demo
                    </button>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    className="
            pt-8 grid grid-cols-3 gap-4
            border-t border-[var(--card-border)] mt-8
          "
                >
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center sm:items-start">
                            <div className="flex items-center text-[var(--primary)] mb-1">
                                <span className="mr-2">{stat.icon}</span>
                                <span className="font-bold text-xl">{stat.value}</span>
                            </div>
                            <p className="text-[var(--muted)] text-sm">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Visual Mockups */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="md:w-1/2 w-full h-[400px] mb-10 md:mb-0 relative"
            >
                <div className="relative w-full h-full overflow-hidden">
                    {/* Card 1 */}
                    <div className="
            absolute z-10 w-64 h-96
            bg-[var(--card)] rounded-2xl shadow-xl p-4
            top-10 left-10 -rotate-6
          ">
                        <div className="w-full h-6 bg-[var(--card-border)] rounded-full mb-4"></div>
                        <div className="w-3/4 h-4 bg-[var(--card-border)] rounded-full mb-3"></div>
                        <div className="w-full h-32 bg-[var(--primary)]/10 rounded-lg mb-4"></div>
                        <div className="w-1/2 h-4 bg-[var(--card-border)] rounded-full mb-3"></div>
                        <div className="w-3/4 h-4 bg-[var(--card-border)] rounded-full"></div>
                    </div>

                    {/* Card 2 */}
                    <div className="
            absolute z-20 w-64 h-80
            bg-[var(--card)] rounded-2xl shadow-xl p-4
            bottom-10 right-10 rotate-6
          ">
                        <div className="w-10 h-10 rounded-full bg-[var(--card-border)] mb-3"></div>
                        <div className="w-3/4 h-4 bg-[var(--card-border)] rounded-full mb-3"></div>
                        <div className="w-full h-24 bg-[var(--secondary)]/10 rounded-lg mb-4"></div>
                        <div className="w-full h-24 bg-[var(--primary)]/5 rounded-lg"></div>
                    </div>

                    {/* Card 3 */}
                    <div className="
            absolute z-30 w-52 h-52
            bg-[var(--card)] rounded-2xl shadow-xl p-4
            top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          ">
                        <div className="flex items-center mb-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--primary)] mr-2"></div>
                            <div className="w-1/2 h-4 bg-[var(--card-border)] rounded-full"></div>
                        </div>
                        <div className="w-full h-28 bg-[var(--card-border)] rounded-lg mb-3"></div>
                        <div className="flex justify-between">
                            <div className="w-8 h-8 rounded-full bg-[var(--card-border)]"></div>
                            <div className="w-8 h-8 rounded-full bg-[var(--card-border)]"></div>
                            <div className="w-8 h-8 rounded-full bg-[var(--card-border)]"></div>
                        </div>
                    </div>

                    {/* Decorative */}
                    <div className="absolute -bottom-5 -right-5 w-24 h-24 bg-[var(--primary)]/20 rounded-full blur-xl"></div>
                    <div className="absolute top-10 -left-10 w-32 h-32 bg-[var(--secondary)]/20 rounded-full blur-xl"></div>
                </div>
            </motion.div>
        </section>
    );
};

export default HeroSection;
