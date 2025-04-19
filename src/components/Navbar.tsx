'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from './Logo';
import { FiMenu, FiX, FiSearch, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from './ThemeProvider';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleMenu = () => setIsOpen(o => !o);

  // tailwind opacity helper
  const opacityClass = scrolled ? 'bg-opacity-90' : 'bg-opacity-80';
  const paddingClass = scrolled ? 'py-2 backdrop-blur-md shadow-sm' : 'py-4 backdrop-blur-sm';

  return (
      <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className={`
        fixed w-full z-50
        bg-[var(--card)] ${opacityClass}
        transition-all duration-300
        ${paddingClass}
      `}
      >
        <div className="container mx-auto flex items-center justify-between px-6">
          <Link href="/" className="flex items-center z-20">
            <Logo />
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Search */}
            <div className="relative">
              <input
                  type="text"
                  placeholder="Search..."
                  className={`
                w-40 lg:w-56
                py-2 pl-10 pr-4
                rounded-full
                bg-[var(--background)]
                border border-[var(--card-border)]
                placeholder:text-[var(--muted)]
                focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
                text-sm
                text-[var(--foreground)]
              `}
              />
              <FiSearch className="absolute left-3 top-2.5 text-[var(--muted)]" />
            </div>

            {/* Links */}
            {['Features','How It Works','Community','Testimonials'].map(label => (
                <Link
                    key={label}
                    href={`#${label.toLowerCase().replace(/ /g, '-')}`}
                    className="
                px-3 py-2
                text-[var(--foreground)]
                hover:text-[var(--primary)]
                transition-colors
              "
                >
                  {label}
                </Link>
            ))}

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-[var(--card-border)] transition-colors"
                aria-label="Toggle theme"
            >
              {theme === 'dark'
                  ? <FiSun className="text-[var(--primary)]" size={20}/>
                  : <FiMoon className="text-[var(--foreground)]" size={20}/>
              }
            </button>

            {/* Auth Buttons */}
            <Link
                href="/login"
                className="
              px-4 py-2
              border border-[var(--primary)]
              text-[var(--primary)]
              rounded-lg
              hover:bg-[var(--primary)]/10
              transition-colors
            "
            >
              Log In
            </Link>
            <Link
                href="#get-started"
                className="
              px-4 py-2
              bg-[var(--primary)]
              hover:bg-[var(--secondary)]
              text-white
              rounded-lg
              transition-colors
            "
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Buttons */}
          <div className="md:hidden flex items-center space-x-3 z-20">
            <button
                onClick={toggleTheme}
                className="text-[var(--foreground)]"
                aria-label="Toggle theme"
            >
              {theme === 'dark'
                  ? <FiSun className="text-[var(--primary)]" size={20}/>
                  : <FiMoon className="text-[var(--foreground)]" size={20}/>
              }
            </button>
            <button
                onClick={toggleMenu}
                className="text-[var(--foreground)]"
                aria-label="Toggle menu"
            >
              {isOpen ? <FiX size={24}/> : <FiMenu size={24}/>}
            </button>
          </div>

          {/* Mobile Nav */}
          <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{
                opacity: isOpen ? 1 : 0,
                x: isOpen ? 0 : '100%',
              }}
              transition={{ duration: 0.3 }}
              className={`
            fixed top-0 right-0 h-screen w-3/4
            bg-[var(--card)] p-6
            z-10 shadow-xl flex flex-col
          `}
          >
            {/* Search */}
            <div className="relative mb-6">
              <input
                  type="text"
                  placeholder="Search..."
                  className={`
                w-full
                py-2 pl-10 pr-4
                rounded-full
                bg-[var(--background)]
                border border-[var(--card-border)]
                placeholder:text-[var(--muted)]
                focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
                text-[var(--foreground)]
              `}
              />
              <FiSearch className="absolute left-3 top-3 text-[var(--muted)]" />
            </div>

            {/* Links */}
            {['Features','How It Works','Community','Testimonials'].map(label => (
                <Link
                    key={label}
                    href={`#${label.toLowerCase().replace(/ /g, '-')}`}
                    onClick={toggleMenu}
                    className="
                py-3
                text-[var(--foreground)]
                border-b border-[var(--card-border)]
                hover:text-[var(--primary)]
                transition-colors
              "
                >
                  {label}
                </Link>
            ))}

            {/* Auth Buttons */}
            <div className="mt-8 flex flex-col space-y-4">
              <Link
                  href="/login"
                  onClick={toggleMenu}
                  className="
                py-3 text-center
                border border-[var(--primary)]
                text-[var(--primary)]
                rounded-lg
                hover:bg-[var(--primary)]/10
                transition-colors
              "
              >
                Log In
              </Link>
              <Link
                  href="#get-started"
                  onClick={toggleMenu}
                  className="
                py-3 text-center
                bg-[var(--primary)]
                hover:bg-[var(--secondary)]
                text-white
                rounded-lg
              "
              >
                Sign Up
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.nav>
  );
};

export default Navbar;
