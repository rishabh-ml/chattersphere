"use client";

import Header from "@/components/header";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TermsOfService() {
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

            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Terms of Service</h1>
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
                  Welcome to ChatterSphere. These Terms of Service (&#34;Terms&#34;) govern your
                  access to and use of the ChatterSphere platform, including any websites, mobile
                  applications, and other online services that link to these Terms (collectively,
                  the &#34;Services&#34;).
                </p>
                <p>
                  By accessing or using our Services, you agree to be bound by these Terms. If you
                  do not agree to these Terms, you may not access or use the Services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  2. Using ChatterSphere
                </h2>
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  2.1 Who Can Use ChatterSphere
                </h3>
                <p>
                  You must be at least 13 years old to use our Services. If you are under 18, you
                  must have your parent or legal guardian&#39;s permission to use our Services and
                  they must agree to these Terms on your behalf.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  2.2 Registration and Account Security
                </h3>
                <p>
                  To access certain features of our Services, you may need to register for an
                  account. You agree to provide accurate, current, and complete information during
                  the registration process and to update such information to keep it accurate,
                  current, and complete.
                </p>
                <p>
                  You are responsible for safeguarding your account credentials and for all
                  activities that occur under your account. You agree to notify us immediately of
                  any unauthorized use of your account.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  2.3 Your Use of the Services
                </h3>
                <p>
                  You agree to use the Services only for lawful purposes and in accordance with
                  these Terms. You agree not to:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>
                    Use the Services in any way that violates any applicable law or regulation
                  </li>
                  <li>
                    Use the Services for the purpose of exploiting, harming, or attempting to
                    exploit or harm minors
                  </li>
                  <li>
                    Transmit any material that is defamatory, obscene, indecent, abusive, offensive,
                    harassing, violent, hateful, inflammatory, or otherwise objectionable
                  </li>
                  <li>
                    Impersonate or attempt to impersonate ChatterSphere, a ChatterSphere employee,
                    another user, or any other person or entity
                  </li>
                  <li>
                    Engage in any other conduct that restricts or inhibits anyone&#39;s use or
                    enjoyment of the Services
                  </li>
                  <li>
                    Use the Services in any manner that could disable, overburden, damage, or impair
                    the Services
                  </li>
                  <li>
                    Use any robot, spider, or other automatic device, process, or means to access
                    the Services for any purpose
                  </li>
                  <li>
                    Introduce any viruses, Trojan horses, worms, logic bombs, or other material that
                    is malicious or technologically harmful
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. User Content</h2>
                <h3 className="text-xl font-medium text-gray-800 mb-2">3.1 Content Ownership</h3>
                <p>
                  You retain ownership rights in your content. However, by submitting content to
                  ChatterSphere, you grant us a non-exclusive, transferable, sub-licensable,
                  royalty-free, worldwide license to use, modify, publicly perform, publicly
                  display, reproduce, and distribute your content in connection with operating and
                  providing the Services.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  3.2 Content Responsibility
                </h3>
                <p>
                  You are solely responsible for your content and the consequences of sharing it.
                  You represent and warrant that:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>
                    You own or have the necessary rights to use and authorize ChatterSphere to use
                    your content
                  </li>
                  <li>
                    Your content does not violate the privacy rights, publicity rights, copyrights,
                    contract rights, or any other rights of any person or entity
                  </li>
                  <li>
                    Your content complies with these Terms and all applicable laws and regulations
                  </li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-2">3.3 Content Moderation</h3>
                <p>
                  We reserve the right to remove any content that violates these Terms or that we
                  find objectionable for any reason. We may also suspend or terminate your account
                  for posting such content.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  4. Intellectual Property Rights
                </h2>
                <p>
                  The Services and their entire contents, features, and functionality (including but
                  not limited to all information, software, text, displays, images, video, and
                  audio, and the design, selection, and arrangement thereof) are owned by
                  ChatterSphere, its licensors, or other providers of such material and are
                  protected by copyright, trademark, patent, trade secret, and other intellectual
                  property or proprietary rights laws.
                </p>
                <p>
                  These Terms do not grant you any right, title, or interest in the Services,
                  others&#39; content on the Services, or ChatterSphere trademarks, logos, or other
                  brand features.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Privacy</h2>
                <p>
                  Your privacy is important to us. Our{" "}
                  <Link href="/privacy-policy" className="text-[#38BDF8] hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  explains how we collect, use, and share information about you when you use our
                  Services. By using our Services, you agree to the collection, use, and sharing of
                  your information as described in our Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Termination</h2>
                <p>
                  We may terminate or suspend your account and bar access to the Services
                  immediately, without prior notice or liability, under our sole discretion, for any
                  reason whatsoever and without limitation, including but not limited to a breach of
                  the Terms.
                </p>
                <p>
                  If you wish to terminate your account, you may simply discontinue using the
                  Services or contact us to request account deletion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  7. Disclaimer of Warranties
                </h2>
                <p>
                  THE SERVICES ARE PROVIDED &#34;AS IS&#34; AND &#34;AS AVAILABLE&#34; WITHOUT
                  WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
                  IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                  NON-INFRINGEMENT.
                </p>
                <p>
                  WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, THAT
                  DEFECTS WILL BE CORRECTED, OR THAT THE SERVICES OR THE SERVERS THAT MAKE THEM
                  AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  8. Limitation of Liability
                </h2>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL CHATTERSPHERE,
                  ITS AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS,
                  OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY,
                  ARISING OUT OF OR IN CONNECTION WITH YOUR USE, OR INABILITY TO USE, THE SERVICES,
                  INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE
                  DAMAGES.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Indemnification</h2>
                <p>
                  You agree to defend, indemnify, and hold harmless ChatterSphere, its affiliates,
                  licensors, and service providers, and its and their respective officers,
                  directors, employees, contractors, agents, licensors, suppliers, successors, and
                  assigns from and against any claims, liabilities, damages, judgments, awards,
                  losses, costs, expenses, or fees (including reasonable attorneys&#39; fees)
                  arising out of or relating to your violation of these Terms or your use of the
                  Services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Changes to Terms</h2>
                <p>
                  We may revise and update these Terms from time to time in our sole discretion. All
                  changes are effective immediately when we post them. Your continued use of the
                  Services following the posting of revised Terms means that you accept and agree to
                  the changes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Governing Law</h2>
                <p>
                  These Terms and your use of the Services shall be governed by and construed in
                  accordance with the laws of the jurisdiction in which ChatterSphere is
                  established, without regard to its conflict of law principles.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Contact Us</h2>
                <p>If you have any questions about these Terms, please contact us at:</p>
                <p className="font-medium">
                  Email: terms@chattersphere.com
                  <br />
                  Address: 123 Social Street, Community City, CS 12345
                </p>
              </section>
            </div>

            <div className="mt-12 border-t border-gray-200 pt-8">
              <p className="text-gray-600">
                For more information about our practices, please also review our{" "}
                <Link href="/privacy-policy" className="text-[#38BDF8] hover:underline">
                  Privacy Policy
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
