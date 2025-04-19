'use client';
import React from 'react';
import { motion } from 'framer-motion';
import {
    MessageCircleMore,
    Users,
    TrendingUp,
    Globe,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const FeaturesSection: React.FC = () => {
    const features = [
        {
            icon: MessageCircleMore,
            title: 'Real-time Chat',
            desc: 'Instant messaging with read receipts, typing indicators, and media sharing. Connect with friends through seamless one-on-one and group conversations.',
            color: 'bg-[var(--primary)]/10',
            iconColor: 'text-[var(--primary)]'
        },
        {
            icon: Users,
            title: 'Communities',
            desc: 'Create and join public or private communities based on shared interests. Host events, share resources, and build connections in moderated spaces.',
            color: 'bg-[var(--primary)]/10',
            iconColor: 'text-[var(--primary)]'
        },
        {
            icon: TrendingUp,
            title: 'Trending Topics',
            desc: "Discover what's capturing global attention with our algorithm that surfaces meaningful conversations, not just viral content.",
            color: 'bg-[var(--primary)]/10',
            iconColor: 'text-[var(--primary)]'
        },
        {
            icon: Globe,
            title: 'Global Reach',
            desc: 'Connect with creators and communities worldwide. Translation features and cultural context tools help bridge communication gaps.',
            color: 'bg-[var(--primary)]/10',
            iconColor: 'text-[var(--primary)]'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
    };

    return (
        <section
            id="features"
            className="
        py-24 px-6 md:px-16
        bg-[var(--background)]
        text-[var(--foreground)]
      "
        >
            <div className="container mx-auto max-w-7xl">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div
                        className="
              inline-block
              bg-[var(--primary)]/10 text-[var(--primary)]
              px-4 py-1 rounded-full
              text-sm font-semibold mb-4
            "
                    >
                        Powerful Features
                    </div>
                    <h2
                        className="
              text-3xl md:text-4xl font-bold
              text-[var(--foreground)] mb-4
            "
                    >
                        Everything You Need to Connect
                    </h2>
                    <p className="text-[var(--muted)] max-w-2xl mx-auto">
                        ChatterSphere combines intuitive design with powerful functionality
                        to help you build meaningful connections and engage with communities
                        that matter to you.
                    </p>
                </motion.div>

                {/* Featured item */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="
            bg-gradient-to-r
            from-[var(--primary)]/5 to-[var(--secondary)]/5
            rounded-2xl p-8 md:p-12 mb-16 shadow-sm
          "
                >
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <div
                                className="
                  bg-[var(--primary)]/10
                  w-16 h-16 rounded-2xl
                  flex items-center justify-center mb-6
                "
                            >
                                <MessageCircleMore
                                    className="text-[var(--primary)]"
                                    size={32}
                                />
                            </div>
                            <h3
                                className="
                  text-2xl md:text-3xl font-bold
                  text-[var(--foreground)] mb-4
                "
                            >
                                Smart Conversations
                            </h3>
                            <p className="text-[var(--muted)] mb-6">
                                Our advanced messaging system learns from your interactions to
                                prioritize important messages and filter out noise. With
                                intelligent suggestions and contextual awareness, ChatterSphere
                                helps you have more meaningful conversations.
                            </p>
                            <ul className="space-y-3 mb-8">
                                {[
                                    'End-to-end encryption',
                                    'Message scheduling',
                                    'Smart replies',
                                    'Cross-platform sync'
                                ].map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-center text-[var(--foreground)]"
                                    >
                                        <div
                                            className="
                        w-1.5 h-1.5 rounded-full
                        bg-[var(--primary)] mr-2
                      "
                                        />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="#"
                                className="
                  inline-flex items-center
                  text-[var(--primary)] font-medium
                "
                            >
                                Learn more
                                <ChevronRight size={16} className="ml-1" />
                            </Link>
                        </div>

                        <div
                            className="
                bg-[var(--card)]
                rounded-xl shadow-lg p-4 relative
              "
                        >
                            <div
                                className="
                  aspect-[3/2]
                  bg-[var(--background)]
                  rounded-lg w-full relative overflow-hidden
                "
                            >
                                {/* Simplified mockup of chat interface */}
                                <div className="absolute inset-0 flex flex-col p-4">
                                    <div className="flex items-center space-x-2 pb-3 border-b border-[var(--card-border)]">
                                        <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20" />
                                        <div className="h-4 w-24 bg-[var(--card-border)] rounded" />
                                    </div>
                                    <div className="flex-1 flex flex-col space-y-3 py-3 overflow-hidden">
                                        <div className="self-start max-w-[70%] bg-[var(--card-border)] p-2 rounded-lg">
                                            <div className="h-2 w-32 bg-[var(--card-border)] rounded mb-1" />
                                            <div className="h-2 w-20 bg-[var(--card-border)] rounded" />
                                        </div>
                                        <div className="self-end max-w-[70%] bg-[var(--primary)]/20 p-2 rounded-lg">
                                            <div className="h-2 w-28 bg-[var(--primary)]/30 rounded mb-1" />
                                            <div className="h-2 w-36 bg-[var(--primary)]/30 rounded" />
                                        </div>
                                        <div className="self-start max-w-[70%] bg-[var(--card-border)] p-2 rounded-lg">
                                            <div className="h-2 w-24 bg-[var(--card-border)] rounded" />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-3 border-t border-[var(--card-border)]">
                                        <div className="flex-1 h-8 bg-[var(--card-border)] rounded-full" />
                                        <div className="w-8 h-8 rounded-full bg-[var(--primary)]/30" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Other features */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {features.slice(1).map((feature) => (
                        <motion.div
                            key={feature.title}
                            variants={itemVariants}
                            className="
                bg-[var(--card)]
                border border-[var(--card-border)]
                p-6 rounded-xl
                shadow-sm hover:shadow-md
                transition-shadow duration-300
              "
                        >
                            <div
                                className={`
                  ${feature.color}
                  w-14 h-14 rounded-xl
                  flex items-center justify-center mb-5
                `}
                            >
                                <feature.icon
                                    className={feature.iconColor}
                                    size={28}
                                />
                            </div>
                            <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-[var(--muted)]">{feature.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="mt-16 text-center"
                >
                    <Link
                        href="#"
                        className="
              inline-flex items-center
              bg-[var(--primary)] hover:bg-[var(--primary)]/90
              text-white font-semibold
              py-3 px-6 rounded-lg
              transition-colors
            "
                    >
                        Explore All Features
                        <ChevronRight size={16} className="ml-2" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default FeaturesSection;
