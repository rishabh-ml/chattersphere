"use client";

import { ArrowRight, Play, Users, MessageSquare, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Header from "../components/header";
import FeatureCard from "../components/feature-card";
import StepCard from "../components/step-card";
import LandingCommunityCard from "../components/landing-community-card";
import TestimonialCard from "../components/testimonial-card";
import { SignUpButton } from "@clerk/nextjs";
import Image from "next/image";
import NewsletterSection from "@/components/Newsletter";
import Link from "next/link";

export default function Home() {
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
              ChatterSphere connects you with communities that share your passions. Join meaningful
              conversations, make new friends, and discover content that matters to you.
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
            {
              icon: <Users className="h-8 w-8 text-[#38BDF8]" />,
              value: "2M+",
              label: "Active Users",
            },
            {
              icon: <MessageSquare className="h-8 w-8 text-[#EC4899]" />,
              value: "10M+",
              label: "Daily Messages",
            },
            {
              icon: <Globe className="h-8 w-8 text-[#38BDF8]" />,
              value: "50K+",
              label: "Communities",
            },
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
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">
              Why Choose ChatterSphere?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform is designed to make connecting with like-minded people seamless and
              enjoyable.
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
            Getting started with ChatterSphere is easy. Follow these simple steps to join the
            conversation.
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
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">
              Popular Communities
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join these thriving communities and start connecting with people who share your
              interests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <LandingCommunityCard
              icon="Code"
              name="Techies"
              members="450K+"
              description="For tech enthusiasts, developers, and innovators to discuss the latest in technology."
              color="#38BDF8"
            />
            <LandingCommunityCard
              icon="Music"
              name="Music Lovers"
              members="320K+"
              description="Share your favorite tunes, discover new artists, and connect with fellow music enthusiasts."
              color="#EC4899"
            />
            <LandingCommunityCard
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
            Don&apos;t just take our word for it. Here&apos;s what our community members have to say
            about ChatterSphere.
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
              <p className="text-gray-400">
                Where conversations come alive and communities thrive.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/#features"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#how-it-works"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#community"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                  >
                    Community
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#testimonials"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                  >
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about-developers"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                  >
                    About Devs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookie-policy"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact-us"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                {["Facebook", "Twitter", "Instagram", "Linkedin"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                  >
                    <Image
                      src={`/icons/${social.toLowerCase()}.svg`}
                      alt={`${social} icon`}
                      width={24}
                      height={24}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} ChatterSphere. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
