"use client"

import Header from "@/components/header"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function CookiePolicy() {
  const router = useRouter()
  
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
            
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Cookie Policy</h1>
            <p className="text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            
            <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
                <p>
                  This Cookie Policy explains how ChatterSphere (&#34;we&#34;, &#34;us&#34;, or &#34;our&#34;) uses cookies and similar technologies to recognize you when you visit our platform. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
                </p>
                <p>
                  This Cookie Policy should be read together with our <Link href="/privacy-policy" className="text-[#38BDF8] hover:underline">Privacy Policy</Link> and <Link href="/terms-of-service" className="text-[#38BDF8] hover:underline">Terms of Service</Link>.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. What Are Cookies?</h2>
                <p>
                  Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work, or to work more efficiently, as well as to provide reporting information.
                </p>
                <p>
                  Cookies set by the website owner (in this case, ChatterSphere) are called &#34;first-party cookies&#34;. Cookies set by parties other than the website owner are called &#34;third-party cookies&#34;. Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics).
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Why Do We Use Cookies?</h2>
                <p>
                  We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our platform to operate, and we refer to these as &#34;essential&#34; or &#34;strictly necessary&#34; cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our platform. Third parties serve cookies through our platform for advertising, analytics, and other purposes.
                </p>
                <p>
                  The specific types of first and third-party cookies served through our platform and the purposes they perform are described below:
                </p>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">3.1 Essential Cookies</h3>
                <p>
                  These cookies are strictly necessary to provide you with services available through our platform and to use some of its features, such as access to secure areas. Because these cookies are strictly necessary to deliver the platform, you cannot refuse them without impacting how our platform functions.
                </p>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">3.2 Performance and Functionality Cookies</h3>
                <p>
                  These cookies are used to enhance the performance and functionality of our platform but are non-essential to their use. However, without these cookies, certain functionality may become unavailable.
                </p>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">3.3 Analytics and Customization Cookies</h3>
                <p>
                  These cookies collect information that is used either in aggregate form to help us understand how our platform is being used or how effective our marketing campaigns are, or to help us customize our platform for you.
                </p>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">3.4 Advertising Cookies</h3>
                <p>
                  These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed, and in some cases selecting advertisements that are based on your interests.
                </p>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">3.5 Social Media Cookies</h3>
                <p>
                  These cookies are used to enable you to share pages and content that you find interesting on our platform through third-party social networking and other websites. These cookies may also be used for advertising purposes.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. How Can You Control Cookies?</h2>
                <p>
                  You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by clicking on the appropriate opt-out links provided in the cookie banner on our platform.
                </p>
                <p>
                  You can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our platform though your access to some functionality and areas may be restricted. As the means by which you can refuse cookies through your web browser controls vary from browser to browser, you should visit your browser&#39;s help menu for more information.
                </p>
                <p>
                  In addition, most advertising networks offer you a way to opt out of targeted advertising. If you would like to find out more information, please visit <a href="http://www.aboutads.info/choices/" className="text-[#38BDF8] hover:underline" target="_blank" rel="noopener noreferrer">http://www.aboutads.info/choices/</a> or <a href="http://www.youronlinechoices.com" className="text-[#38BDF8] hover:underline" target="_blank" rel="noopener noreferrer">http://www.youronlinechoices.com</a>.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Specific Cookies We Use</h2>
                <p>
                  Below is a detailed list of the cookies we use on our platform:
                </p>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 mt-4">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Cookie Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">_session_id</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border-b">Used to maintain your session state</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">Session</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">Essential</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">_cs_auth</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border-b">Used for authentication purposes</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">1 year</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">Essential</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">_cs_preferences</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border-b">Stores your preferences settings</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">1 year</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">Functionality</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">_cs_analytics</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border-b">Used to track anonymous analytics data</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">2 years</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">Analytics</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">_cs_ads</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border-b">Used for advertising purposes</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">90 days</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">Advertising</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Changes to This Cookie Policy</h2>
                <p>
                  We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
                </p>
                <p>
                  The date at the top of this Cookie Policy indicates when it was last updated.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Contact Us</h2>
                <p>
                  If you have any questions about our use of cookies or other technologies, please contact us at:
                </p>
                <p className="font-medium">
                  Email: privacy@chattersphere.com<br />
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
                <Link href="/terms-of-service" className="text-[#38BDF8] hover:underline">
                  Terms of Service
                </Link>.
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
