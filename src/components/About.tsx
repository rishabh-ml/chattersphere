'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiLock, FiGlobe, FiStar } from 'react-icons/fi';

const About: React.FC = () => {
  const features = [
    {
      icon: <FiUsers className="text-3xl text-[var(--primary)]" />,
      title: 'Community First',
      description:
          'Build meaningful connections with like-minded individuals in a space designed for authentic engagement.',
    },
    {
      icon: <FiLock className="text-3xl text-[var(--primary)]" />,
      title: 'Privacy Focused',
      description:
          'Your data belongs to you. Our transparent privacy controls put you in charge of what you share.',
    },
    {
      icon: <FiGlobe className="text-3xl text-[var(--primary)]" />,
      title: 'Global Reach',
      description:
          'Connect with communities around the world and discover perspectives that expand your horizons.',
    },
    {
      icon: <FiStar className="text-3xl text-[var(--primary)]" />,
      title: 'Personalized Experience',
      description:
          'Our intelligent algorithm ensures your feed is always relevant to your interests and connections.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
      <section id="about" className="py-24 bg-[var(--background)]">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="
              inline-block
              bg-[var(--primary)]/10 text-[var(--primary)]
              px-4 py-1 rounded-full
              text-sm font-semibold mb-4
            "
            >
              About ChatterSphere
            </motion.div>

            <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="
              text-3xl md:text-4xl font-bold
              text-[var(--foreground)]
              mb-4
            "
            >
              Redefining Social Connection
            </motion.h2>

            <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="max-w-2xl mx-auto text-[var(--muted)]"
            >
              ChatterSphere was born from a simple idea: social media should bring
              people together, not pull them apart. We’ve created a space that
              prioritizes genuine connection, thoughtful exchanges, and community
              building.
            </motion.p>
          </div>

          {/* Illustration + Story/Mission */}
          <div className="grid md:grid-cols-2 gap-12 mb-24 items-center">
            {/* Illustration */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative"
            >
              <div className="
              bg-gradient-to-br
              from-[var(--primary)]/20 to-[var(--secondary)]/20
              rounded-2xl h-[400px] relative overflow-hidden
            ">
                {/* abstract shapes */}
                <div className="absolute w-16 h-16 bg-[var(--primary)] rounded-full top-1/4 left-1/4" />
                <div className="absolute w-3 h-40 bg-[var(--primary)]/40 rounded-full top-1/4 left-1/4 translate-x-8" />
                <div className="absolute w-12 h-12 bg-[var(--secondary)] rounded-full bottom-1/3 left-1/2" />
                <div className="absolute w-3 h-28 bg-[var(--secondary)]/40 rounded-full bottom-1/3 left-1/2 rotate-45" />
                <div className="absolute w-14 h-14 bg-[var(--primary)]/80 rounded-full top-1/2 right-1/4" />
                <div className="absolute w-3 h-32 bg-[var(--primary)]/40 rounded-full top-1/2 right-1/4 -rotate-30" />

                {/* blur overlay */}
                <div className="
                absolute top-0 left-0 w-full h-full
                bg-[var(--card)]/10 backdrop-blur-sm
                rounded-2xl
              " />

                {/* mock UI card */}
                <div className="
                absolute bottom-6 right-6
                bg-[var(--card)]
                p-4 rounded-xl shadow-lg w-56
              ">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-[var(--primary)] rounded-full" />
                    <div className="h-3 bg-[var(--card-border)] rounded-full w-20" />
                  </div>
                  <div className="h-2 bg-[var(--card-border)] rounded-full w-full mb-2" />
                  <div className="h-2 bg-[var(--card-border)] rounded-full w-3/4 mb-4" />
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-16 bg-[var(--primary)]/20 rounded-full" />
                    <div className="h-6 w-6 bg-[var(--secondary)]/20 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Story & Mission */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-8"
            >
              <motion.div variants={itemVariants}>
                <h3 className="text-2xl font-bold mb-4 text-[var(--foreground)]">
                  Our Story
                </h3>
                <p className="text-[var(--muted)] mb-4">
                  Founded in 2023, ChatterSphere emerged as a response to the
                  growing dissatisfaction with existing social platforms. Our team
                  of passionate developers and designers set out to create
                  something different—a platform that values quality interactions
                  over vanity metrics.
                </p>
                <p className="text-[var(--muted)]">
                  Today, ChatterSphere hosts millions of users worldwide who come
                  together to share ideas, support each other, and build lasting
                  relationships in a positive online environment.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-8">
                <h3 className="text-2xl font-bold mb-4 text-[var(--foreground)]">
                  Our Mission
                </h3>
                <p className="text-[var(--muted)]">
                  We&apos;re on a mission to transform how people connect online by
                  fostering meaningful conversations and creating spaces where
                  everyone feels valued and heard. We believe social media should
                  enrich your life, not complicate it.
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* Feature Grid */}
          <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, idx) => (
                <motion.div
                    key={idx}
                    variants={itemVariants}
                    className="
                bg-[var(--card)]
                p-6 rounded-xl
                shadow-sm hover:shadow-md
                transition-shadow duration-300
                border border-[var(--card-border)]
              "
                >
                  <div className="
                bg-[var(--primary)]/10
                w-14 h-14 rounded-full
                flex items-center justify-center mb-4
              ">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-[var(--foreground)]">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--muted)]">{feature.description}</p>
                </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
  );
};

export default About;
