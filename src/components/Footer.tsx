'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Github, Twitter, Instagram, Linkedin, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  const footerLinks = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Roadmap', href: '#roadmap' },
        { label: 'FAQ', href: '#faq' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#about' },
        { label: 'Testimonials', href: '#testimonials' },
        { label: 'Blog', href: '#blog' },
        { label: 'Careers', href: '#careers' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '#docs' },
        { label: 'Community', href: '#community' },
        { label: 'Support', href: '#support' },
        { label: 'Privacy', href: '#privacy' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com' },
    { icon: Instagram, href: 'https://instagram.com' },
    { icon: Linkedin, href: 'https://linkedin.com' },
    { icon: Github, href: 'https://github.com' },
  ];

  return (
      <footer className="bg-[var(--background)] pt-16 pb-8 border-t border-[var(--card-border)]">
        <div className="container mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center mr-3">
                  <MessageCircle className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <span className="text-xl font-bold text-[var(--foreground)]">
                ChatterSphere
              </span>
              </div>
              <p className="text-[var(--muted)] mb-6 max-w-xs">
                Connect with communities that matter to you through seamless
                conversations and meaningful interactions.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social, idx) => (
                    <motion.a
                        key={idx}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ y: -3 }}
                        className="
                    w-9 h-9 rounded-full
                    bg-[var(--card)]
                    hover:bg-[var(--primary)]/10
                    flex items-center justify-center
                    text-[var(--muted)]
                    hover:text-[var(--primary)]
                    transition-colors
                  "
                    >
                      <social.icon size={18} />
                    </motion.a>
                ))}
              </div>
            </div>

            {/* Links columns */}
            {footerLinks.map(group => (
                <div key={group.title}>
                  <h3 className="font-semibold text-[var(--foreground)] mb-4">
                    {group.title}
                  </h3>
                  <ul className="space-y-3">
                    {group.links.map(link => (
                        <li key={link.label}>
                          <Link
                              href={link.href}
                              className="
                        text-[var(--muted)]
                        hover:text-[var(--primary)]
                        transition-colors
                      "
                          >
                            {link.label}
                          </Link>
                        </li>
                    ))}
                  </ul>
                </div>
            ))}
          </div>

          <div className="pt-8 border-t border-[var(--card-border)] flex flex-col md:flex-row justify-between items-center">
            <p className="text-[var(--muted)] text-sm">
              &copy; {new Date().getFullYear()} ChatterSphere. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {['Terms of Service', 'Privacy Policy', 'Cookies'].map(label => (
                  <Link
                      key={label}
                      href={`#${label.toLowerCase().replace(/ /g, '-')}`}
                      className="
                  text-[var(--muted)]
                  hover:text-[var(--primary)]
                  text-sm
                  transition-colors
                "
                  >
                    {label}
                  </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
  );
};

export default Footer;
