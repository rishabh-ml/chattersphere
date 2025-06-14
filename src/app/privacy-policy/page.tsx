"use client";

import Header from "@/components/header";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
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

            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Privacy Policy</h1>
            <p className="text-gray-600 mb-8">
              Last Updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>

            <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
                <p>
                  Welcome to ChatterSphere. We respect your privacy and are committed to protecting
                  your personal data. This Privacy Policy explains how we collect, use, disclose,
                  and safeguard your information when you use our platform.
                </p>
                <p>
                  Please read this Privacy Policy carefully. If you do not agree with the terms of
                  this Privacy Policy, please do not access the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  2. Information We Collect
                </h2>
                <h3 className="text-xl font-medium text-gray-800 mb-2">2.1 Personal Information</h3>
                <p>We may collect personal information that you provide directly to us, such as:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Account information (name, email address, password, profile picture)</li>
                  <li>Profile information (biography, location, interests)</li>
                  <li>Content you post (messages, comments, media)</li>
                  <li>Communications with other users and with us</li>
                  <li>Survey responses and feedback</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  2.2 Automatically Collected Information
                </h3>
                <p>
                  When you access or use our platform, we automatically collect certain information,
                  including:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>
                    Device information (hardware model, operating system, unique device identifiers)
                  </li>
                  <li>Log information (access times, pages viewed, IP address)</li>
                  <li>Location information (based on IP address or GPS with your consent)</li>
                  <li>Usage information (interactions with the platform, content viewed)</li>
                  <li>Cookies and similar technologies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  3. How We Use Your Information
                </h2>
                <p>We use the information we collect for various purposes, including to:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Provide, maintain, and improve our platform</li>
                  <li>Create and maintain your account</li>
                  <li>Process transactions and send related information</li>
                  <li>Send administrative messages, updates, and security alerts</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Personalize your experience and provide content recommendations</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>
                    Detect, investigate, and prevent fraudulent transactions and other illegal
                    activities
                  </li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  4. Sharing of Information
                </h2>
                <p>We may share the information we collect in various ways, including:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>With other users according to your privacy settings</li>
                  <li>
                    With vendors, consultants, and service providers who need access to such
                    information to perform services on our behalf
                  </li>
                  <li>
                    In response to a request for information if we believe disclosure is in
                    accordance with applicable law
                  </li>
                  <li>
                    If we believe your actions are inconsistent with our user agreements or policies
                  </li>
                  <li>
                    In connection with, or during negotiations of, any merger, sale of company
                    assets, financing, or acquisition
                  </li>
                  <li>With your consent or at your direction</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  5. Your Rights and Choices
                </h2>
                <p>You have several rights regarding your personal information:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Access, update, or delete your information through your account settings</li>
                  <li>Object to our processing of your information</li>
                  <li>Request restriction of processing of your information</li>
                  <li>Request portability of your information</li>
                  <li>Opt out of marketing communications</li>
                  <li>Set your browser to reject cookies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Data Security</h2>
                <p>
                  We take reasonable measures to help protect information about you from loss,
                  theft, misuse, unauthorized access, disclosure, alteration, and destruction.
                  However, no internet or electronic transmission is ever fully secure or
                  error-free.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  7. Children&#39;s Privacy
                </h2>
                <p>
                  Our platform is not directed to children under the age of 13, and we do not
                  knowingly collect personal information from children under 13. If we learn that we
                  have collected personal information from a child under 13, we will promptly delete
                  that information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  8. International Data Transfers
                </h2>
                <p>
                  We may transfer the information we collect to, and process it in, countries other
                  than the country in which you reside. These countries may have data protection
                  laws that are different from the laws of your country.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  9. Changes to This Privacy Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. If we make material changes,
                  we will notify you through the platform or by other means. We encourage you to
                  review the Privacy Policy whenever you access the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at:</p>
                <p className="font-medium">
                  Email: privacy@chattersphere.com
                  <br />
                  Address: 123 Social Street, Community City, CS 12345
                </p>
              </section>
            </div>

            <div className="mt-12 border-t border-gray-200 pt-8">
              <p className="text-gray-600">
                For more information about our practices, please also review our{" "}
                <Link href="/terms-of-service" className="text-[#38BDF8] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/cookie-policy" className="text-[#38BDF8] hover:underline">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="bg-[#0F172A] text-white py-12 mt-12">
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
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/contact-us"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:info@chattersphere.com"
                    className="text-gray-400 hover:text-[#38BDF8] transition-colors"
                  >
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.599-.1-.899a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z" />
                      </svg>
                    )}
                    {social === "Facebook" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12.001 2.002c-5.522 0-9.999 4.477-9.999 9.999 0 4.99 3.656 9.126 8.437 9.879v-6.988h-2.54v-2.891h2.54V9.798c0-2.508 1.493-3.891 3.776-3.891 1.094 0 2.24.195 2.24.195v2.459h-1.264c-1.24 0-1.628.772-1.628 1.563v1.875h2.771l-.443 2.891h-2.328v6.988C18.344 21.129 22 16.992 22 12.001c0-5.522-4.477-9.999-9.999-9.999z" />
                      </svg>
                    )}
                    {social === "Instagram" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M11.999 7.377a4.623 4.623 0 1 0 0 9.248 4.623 4.623 0 0 0 0-9.248zm0 7.627a3.004 3.004 0 1 1 0-6.008 3.004 3.004 0 0 1 0 6.008z" />
                        <circle cx="16.806" cy="7.207" r="1.078" />
                        <path d="M20.533 6.111A4.605 4.605 0 0 0 17.9 3.479a6.606 6.606 0 0 0-2.186-.42c-.963-.042-1.268-.054-3.71-.054s-2.755 0-3.71.054a6.554 6.554 0 0 0-2.184.42 4.6 4.6 0 0 0-2.633 2.632 6.585 6.585 0 0 0-.419 2.186c-.043.962-.056 1.267-.056 3.71 0 2.442 0 2.753.056 3.71.015.748.156 1.486.419 2.187a4.61 4.61 0 0 0 2.634 2.632 6.584 6.584 0 0 0 2.185.45c.963.042 1.268.055 3.71.055s2.755 0 3.71-.055a6.615 6.615 0 0 0 2.186-.419 4.613 4.613 0 0 0 2.633-2.633c.263-.7.404-1.438.419-2.186.043-.962.056-1.267.056-3.71s0-2.753-.056-3.71a6.581 6.581 0 0 0-.421-2.217zm-1.218 9.532a5.043 5.043 0 0 1-.311 1.688 2.987 2.987 0 0 1-1.712 1.711 4.985 4.985 0 0 1-1.67.311c-.95.044-1.218.055-3.654.055-2.438 0-2.687 0-3.655-.055a4.96 4.96 0 0 1-1.669-.311 2.985 2.985 0 0 1-1.719-1.711 5.08 5.08 0 0 1-.311-1.669c-.043-.95-.053-1.218-.053-3.654 0-2.437 0-2.686.053-3.655a5.038 5.038 0 0 1 .311-1.687c.305-.789.93-1.41 1.719-1.712a5.01 5.01 0 0 1 1.669-.311c.951-.043 1.218-.055 3.655-.055s2.687 0 3.654.055a4.96 4.96 0 0 1 1.67.311 2.991 2.991 0 0 1 1.712 1.712 5.08 5.08 0 0 1 .311 1.669c.043.951.054 1.218.054 3.655 0 2.436 0 2.698-.043 3.654h-.011z" />
                      </svg>
                    )}
                    {social === "Linkedin" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
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
  );
}
