'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowLeft, ArrowRight, Quote } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/components/ThemeProvider';

const testimonials = [
  {
    quote: "ChatterSphere helped me find my tribe! The UI is sleek and the chat is lightning fast. I've been able to connect with designers worldwide.",
    author: 'Alex Parker',
    role: 'UI/UX Designer',
    company: 'DesignHub',
    avatar: '/avatars/alex.png',
    rating: 5,
  },
  {
    quote: "I've built three new study groups in a week. The community tools are top notch and have completely transformed how our university club communicates.",
    author: 'Jasmine Khan',
    role: 'Student Leader',
    company: 'Berkeley University',
    avatar: '/avatars/jasmine.png',
    rating: 5,
  },
  {
    quote: "Perfect place for creative brainstorming. Love the trending feed feature! It's helped our startup team collaborate more efficiently than ever before.",
    author: 'Miguel Rodriguez',
    role: 'Product Manager',
    company: 'TechStart Inc',
    avatar: '/avatars/miguel.png',
    rating: 4,
  },
  {
    quote: "The attention to privacy details sets ChatterSphere apart from other platforms. I can safely discuss sensitive topics with my support group.",
    author: 'Sarah Johnson',
    role: 'Community Organizer',
    company: 'HealthConnect',
    avatar: '/avatars/sarah.png',
    rating: 5,
  },
];

export default function Testimonials() {
  const [currentPage, setCurrentPage] = useState(0);
  const { theme } = useTheme(); // trigger re-render on theme change
  const perPage = 2;
  const totalPages = Math.ceil(testimonials.length / perPage);

  const nextPage = () => setCurrentPage(p => (p + 1) % totalPages);
  const prevPage = () => setCurrentPage(p => (p - 1 + totalPages) % totalPages);

  const current = testimonials.slice(
      currentPage * perPage,
      (currentPage + 1) * perPage
  );

  return (
      <section id="testimonials" className="py-24 bg-[var(--background)] overflow-hidden">
        <div className="container mx-auto px-6 md:px-16">
          {/* Header */}
          <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
          >
            <div className="inline-block bg-[var(--primary)]/10 text-[var(--primary)] px-4 py-1 rounded-full text-sm font-semibold mb-4">
              Testimonials
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
              What Our Community Says
            </h2>
            <p className="text-[var(--muted)] max-w-2xl mx-auto">
              Join thousands of satisfied users who have transformed their social experience with ChatterSphere.
            </p>
          </motion.div>

          {/* Testimonials Grid */}
          <div className="mb-16">
            <motion.div
                key={`testimonials-${theme}`}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="grid md:grid-cols-2 gap-8"
            >
              {current.map((t, i) => (
                  <motion.div
                      key={`${t.author}-${currentPage}-${i}-${theme}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ duration: 0.5, delay: i * 0.2 }}
                      className="bg-[var(--card)] p-8 rounded-xl shadow-md border border-[var(--card-border)] relative"
                  >
                    <div className="absolute top-8 right-8 text-[var(--primary)] opacity-20">
                      <Quote size={40} />
                    </div>
                    <div className="flex space-x-1 mb-4">
                      {[...Array(5)].map((_, idx) => (
                          <Star
                              key={idx}
                              size={18}
                              className={
                                idx < t.rating
                                    ? 'text-[var(--primary)] fill-[var(--primary)]'
                                    : 'text-[var(--muted)]'
                              }
                          />
                      ))}
                    </div>
                    <p className="text-[var(--foreground)] mb-6 relative z-10">
                      {t.quote}
                    </p>
                    <div className="flex items-center mt-6">
                      <div className="w-12 h-12 rounded-full bg-[var(--card-border)] overflow-hidden relative">
                        <Image
                            src={t.avatar}
                            alt={`${t.author} avatar`}
                            fill
                            sizes="48px"
                            className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-[var(--foreground)]">
                          {t.author}
                        </h4>
                        <p className="text-[var(--muted)] text-sm">
                          {t.role}, {t.company}
                        </p>
                      </div>
                    </div>
                  </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center space-x-4">
            <button
                onClick={prevPage}
                aria-label="Previous testimonials"
                className="p-3 rounded-full bg-[var(--card)] border border-[var(--card-border)] hover:bg-[var(--primary)]/10 transition-colors"
            >
              <ArrowLeft size={20} className="text-[var(--muted)]" />
            </button>
            <div className="flex space-x-2">
              {[...Array(totalPages)].map((_, idx) => (
                  <button
                      key={idx}
                      onClick={() => setCurrentPage(idx)}
                      aria-label={`Go to page ${idx + 1}`}
                      className={`rounded-full transition-all duration-300 ${
                          currentPage === idx
                              ? 'bg-[var(--primary)] w-8 h-2.5'
                              : 'bg-[var(--muted)] w-2.5 h-2.5'
                      }`}
                  />
              ))}
            </div>
            <button
                onClick={nextPage}
                aria-label="Next testimonials"
                className="p-3 rounded-full bg-[var(--card)] border border-[var(--card-border)] hover:bg-[var(--primary)]/10 transition-colors"
            >
              <ArrowRight size={20} className="text-[var(--muted)]" />
            </button>
          </div>
        </div>
      </section>
  );
}
