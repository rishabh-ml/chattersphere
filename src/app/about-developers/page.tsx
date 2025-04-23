"use client"

import Header from "@/components/header"
import { motion } from "framer-motion"
import { ArrowLeft, Github, Linkedin, Twitter, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

// Developer profiles
const developers = [
  {
    name: "Rishabh Shukla",
    role: "Lead Developer & Founder",
    bio: "Lead Developer & Founder of ChatterSphere, architecting a real-time social discussion platform with Next.js, MongoDB, and AWS. Passionate about full-stack JavaScript, AI-driven automation, and streamlining complex workflows.",
    image: "/avatars/rishabh.png",
    skills: [
      "Next.js",
      "React",
      "Node.js",
      "TypeScript",
      "MongoDB",
      "AWS",
      "Tailwind CSS",
      "Framer Motion",
      "Python",
      "Flask",
      "Pandas",
      "Web Scraping",
      "Docker"
    ],
    social: {
      github:  "https://github.com/rishabh-ml",
      linkedin:"https://linkedin.com/in/rishabh-ml",
      twitter: "https://twitter.com/rishabh",
      website: "https://rishabh-ml.vercel.app"
    }
  },
  {
    name: "Prince Dwivedi",
    role: "Backend Developer",
    bio: "Backend Developer at ChatterSphere, specializing in architecting and building scalable server‐side systems. Responsible for API design, database modeling, authentication, and real‐time features using Node.js and MongoDB.",
    image: "/avatars/prince.png",
    skills: [
      "Node.js",
      "Express.js",
      "MongoDB",
      "TypeScript",
      "GraphQL",
      "Socket.io",
      "AWS Lambda"
    ],
    social: {
      github:   "https://github.com/princedwivedi",
      linkedin: "https://linkedin.com/in/prince-dwivedi",
      twitter:  "https://twitter.com/prince_dwivedi",
      website:  "https://princedwivedi.dev"
    }
  }
]

export default function AboutDevelopers() {
  const router = useRouter()

  return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
              <Button
                  variant="ghost"
                  className="mb-6 text-gray-600 hover:text-[#38BDF8]"
                  onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <div className="text-center mb-16">
                <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Meet Our Team</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  ChatterSphere is built by a passionate team of developers and designers who are dedicated to creating the best social platform for meaningful conversations and community building.
                </p>
              </div>

              {/* single-column layout: one profile per full-width row */}
              <div className="grid grid-cols-1 gap-8 mb-16">
                {developers.map((dev, index) => (
                    <motion.div
                        key={dev.name}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                    >
                      <div className="md:flex">
                        <div className="md:flex-shrink-0 md:w-1/3">
                          <div className="h-64 md:h-full w-full relative">
                            <Image
                                src={dev.image}
                                alt={dev.name}
                                fill
                                className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="p-6 md:p-8 md:w-2/3">
                          <h2 className="text-xl font-bold text-gray-900 mb-1">{dev.name}</h2>
                          <p className="text-[#38BDF8] font-medium mb-4">{dev.role}</p>
                          <p className="text-gray-600 mb-4">{dev.bio}</p>

                          <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                              {dev.skills.map(skill => (
                                  <span
                                      key={skill}
                                      className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-700"
                                  >
                              {skill}
                            </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex space-x-3">
                            <a
                                href={dev.social.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-[#38BDF8] transition-colors"
                                aria-label={`${dev.name}'s GitHub`}
                            >
                              <Github className="h-5 w-5" />
                            </a>
                            <a
                                href={dev.social.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-[#38BDF8] transition-colors"
                                aria-label={`${dev.name}'s LinkedIn`}
                            >
                              <Linkedin className="h-5 w-5" />
                            </a>
                            <a
                                href={dev.social.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-[#38BDF8] transition-colors"
                                aria-label={`${dev.name}'s Twitter`}
                            >
                              <Twitter className="h-5 w-5" />
                            </a>
                            <a
                                href={dev.social.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-[#38BDF8] transition-colors"
                                aria-label={`${dev.name}'s Website`}
                            >
                              <Globe className="h-5 w-5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                ))}
              </div>
            
            <div className="bg-gradient-to-r from-[#38BDF8]/10 to-[#EC4899]/10 rounded-xl p-8 md:p-12 border border-[#38BDF8]/20">
              <div className="md:flex items-center justify-between">
                <div className="mb-6 md:mb-0 md:mr-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Our Team</h2>
                  <p className="text-gray-600 mb-0 md:max-w-xl">
                    We&#39;re always looking for talented individuals who are passionate about building the future of social networking. Check out our open positions and join us on this exciting journey!
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button 
                    className="bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-white"
                    onClick={() => router.push('/contact-us')}
                  >
                    View Open Positions
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Development Journey</h2>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gray-200 transform md:translate-x-[-0.5px]"></div>
                
                {/* Timeline items */}
                {[
                  {
                    date: "January 2025",
                    title: "Project Inception",
                    description: "The idea for ChatterSphere was born out of a desire to create a more meaningful social platform focused on genuine conversations and community building."
                  },
                  {
                    date: "February 2025",
                    title: "Design & Planning",
                    description: "Our team spent months researching, planning, and designing the user experience to ensure ChatterSphere would be intuitive, accessible, and engaging."
                  },
                  {
                    date: "March 2025",
                    title: "Development Begins",
                    description: "With a solid plan in place, our development team started building the core functionality of ChatterSphere using modern web technologies."
                  },
                  {
                    date: "May 2025",
                    title: "Beta Testing",
                    description: "We invited a select group of users to test the platform, providing valuable feedback that helped us refine and improve the experience."
                  },
                  {
                    date: "June 2025",
                    title: "Official Launch",
                    description: "ChatterSphere officially launched to the public, marking the beginning of our journey to transform online social interactions."
                  },
                  {
                    date: "Present",
                    title: "Continuous Improvement",
                    description: "We're constantly working to enhance ChatterSphere with new features, improvements, and optimizations based on user feedback and emerging technologies."
                  }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className={`relative mb-12 md:mb-16 ${
                      index % 2 === 0 ? "md:pr-12 md:text-right md:ml-0 md:mr-auto" : "md:pl-12 md:ml-auto md:mr-0"
                    } pl-10 md:pl-0 md:w-[calc(50%-20px)]`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-0 md:left-auto ${
                      index % 2 === 0 ? "md:right-[-10px]" : "md:left-[-10px]"
                    } top-0 h-5 w-5 rounded-full bg-[#38BDF8] border-4 border-white`}></div>
                    
                    {/* Content */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                      <span className="inline-block px-3 py-1 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] text-xs font-medium mb-3">
                        {item.date}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      
      <footer className="bg-[#0F172A] text-white py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">ChatterSphere</h3>
              <p className="text-gray-400">Where conversations come alive and communities thrive.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/#features" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/#community" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
                    Community
                  </Link>
                </li>
                <li>
                  <Link href="/#testimonials" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link href="/about-developers" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
                    About Devs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy-policy" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact-us" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a href="mailto:info@chattersphere.com" className="text-gray-400 hover:text-[#38BDF8] transition-colors">
                    info@chattersphere.com
                  </a>
                </li>
              </ul>
              <div className="flex space-x-4 mt-4">
                {["Twitter", "Facebook", "Instagram", "Linkedin"].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                    aria-label={social}
                  >
                    {social === "Twitter" && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.599-.1-.899a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z" />
                      </svg>
                    )}
                    {social === "Facebook" && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.001 2.002c-5.522 0-9.999 4.477-9.999 9.999 0 4.99 3.656 9.126 8.437 9.879v-6.988h-2.54v-2.891h2.54V9.798c0-2.508 1.493-3.891 3.776-3.891 1.094 0 2.24.195 2.24.195v2.459h-1.264c-1.24 0-1.628.772-1.628 1.563v1.875h2.771l-.443 2.891h-2.328v6.988C18.344 21.129 22 16.992 22 12.001c0-5.522-4.477-9.999-9.999-9.999z" />
                      </svg>
                    )}
                    {social === "Instagram" && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.999 7.377a4.623 4.623 0 1 0 0 9.248 4.623 4.623 0 0 0 0-9.248zm0 7.627a3.004 3.004 0 1 1 0-6.008 3.004 3.004 0 0 1 0 6.008z" />
                        <circle cx="16.806" cy="7.207" r="1.078" />
                        <path d="M20.533 6.111A4.605 4.605 0 0 0 17.9 3.479a6.606 6.606 0 0 0-2.186-.42c-.963-.042-1.268-.054-3.71-.054s-2.755 0-3.71.054a6.554 6.554 0 0 0-2.184.42 4.6 4.6 0 0 0-2.633 2.632 6.585 6.585 0 0 0-.419 2.186c-.043.962-.056 1.267-.056 3.71 0 2.442 0 2.753.056 3.71.015.748.156 1.486.419 2.187a4.61 4.61 0 0 0 2.634 2.632 6.584 6.584 0 0 0 2.185.45c.963.042 1.268.055 3.71.055s2.755 0 3.71-.055a6.615 6.615 0 0 0 2.186-.419 4.613 4.613 0 0 0 2.633-2.633c.263-.7.404-1.438.419-2.186.043-.962.056-1.267.056-3.71s0-2.753-.056-3.71a6.581 6.581 0 0 0-.421-2.217zm-1.218 9.532a5.043 5.043 0 0 1-.311 1.688 2.987 2.987 0 0 1-1.712 1.711 4.985 4.985 0 0 1-1.67.311c-.95.044-1.218.055-3.654.055-2.438 0-2.687 0-3.655-.055a4.96 4.96 0 0 1-1.669-.311 2.985 2.985 0 0 1-1.719-1.711 5.08 5.08 0 0 1-.311-1.669c-.043-.95-.053-1.218-.053-3.654 0-2.437 0-2.686.053-3.655a5.038 5.038 0 0 1 .311-1.687c.305-.789.93-1.41 1.719-1.712a5.01 5.01 0 0 1 1.669-.311c.951-.043 1.218-.055 3.655-.055s2.687 0 3.654.055a4.96 4.96 0 0 1 1.67.311 2.991 2.991 0 0 1 1.712 1.712 5.08 5.08 0 0 1 .311 1.669c.043.951.054 1.218.054 3.655 0 2.436 0 2.698-.043 3.654h-.011z" />
                      </svg>
                    )}
                    {social === "Linkedin" && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
                      </svg>
                    )}
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
  )
}
