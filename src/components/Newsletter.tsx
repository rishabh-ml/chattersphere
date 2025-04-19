'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Check, Mail, Bell } from 'lucide-react';

export default function Newsletter() {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    return (
        <section
            id="newsletter"
            className="
        py-24
        bg-gradient-to-br from-[var(--primary)]/5 to-[var(--secondary)]/5
        relative overflow-hidden
      "
        >
            {/* Decorative */}
            <div className="
        absolute top-0 left-0 w-64 h-64
        bg-[var(--primary)]/10 rounded-full
        -translate-x-1/2 -translate-y-1/2 blur-3xl
      "></div>
            <div className="
        absolute bottom-0 right-0 w-80 h-80
        bg-[var(--secondary)]/10 rounded-full
        translate-x-1/3 translate-y-1/3 blur-3xl
      "></div>

            <div className="container mx-auto px-6 md:px-16 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <motion.div {...fadeIn} className="text-center mb-10">
                        <div className="
              inline-block
              bg-[var(--primary)]/10 text-[var(--primary)]
              px-4 py-1 rounded-full
              text-sm font-semibold mb-4
            ">
                            Newsletter
                        </div>
                        <h2 className="
              text-3xl md:text-4xl font-bold
              text-[var(--foreground)] mb-4
            ">
                            Stay in the Loop
                        </h2>
                        <p className="text-[var(--muted)] md:text-lg max-w-2xl mx-auto">
                            Get updates on new features, communities, and exclusive events delivered straight to your inbox.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="
              bg-[var(--card)]
              rounded-2xl shadow-lg
              p-8 md:p-10
              border border-[var(--card-border)]
            "
                    >
                        <div className="flex flex-col md:flex-row items-center gap-10 mb-8">
                            <div className="
                w-16 h-16 bg-[var(--primary)]/10
                rounded-xl flex items-center justify-center
                flex-shrink-0
              ">
                                <Mail className="text-[var(--primary)]" size={28} />
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                                    Subscribe to our newsletter
                                </h3>
                                <p className="text-[var(--muted)]">
                                    Join our community and be the first to know about new features and updates.
                                </p>
                            </div>
                        </div>

                        {!isSubmitted ? (
                            <Formik
                                initialValues={{ email: '' }}
                                validationSchema={Yup.object({
                                    email: Yup.string().email('Invalid email address').required('Email is required'),
                                })}
                                onSubmit={(values, { resetForm }) => {
                                    console.log('Subscribe:', values.email);
                                    resetForm();
                                    setIsSubmitted(true);
                                    setTimeout(() => setIsSubmitted(false), 5000);
                                }}
                            >
                                {({ isSubmitting }) => (
                                    <Form className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 relative">
                                            <Field
                                                name="email"
                                                type="email"
                                                placeholder="your@email.com"
                                                className="
                          w-full pl-12 pr-4 py-3.5
                          rounded-lg border border-[var(--card-border)]
                          focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
                          text-[var(--foreground)]
                          placeholder:text-[var(--muted)]
                        "
                                            />
                                            <Bell className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                                            <ErrorMessage
                                                name="email"
                                                component="div"
                                                className="text-red-500 mt-2 text-sm absolute"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="
                        bg-[var(--primary)] hover:bg-[var(--primary)]/90
                        text-[var(--background)]
                        px-8 py-3.5 rounded-lg font-semibold
                        transition-colors flex-shrink-0 shadow-sm
                      "
                                        >
                                            Subscribe
                                        </button>
                                    </Form>
                                )}
                            </Formik>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="
                  bg-green-50 border border-green-100
                  rounded-lg py-4 px-6 flex items-center gap-3
                  text-green-700
                "
                            >
                                <div className="bg-green-100 rounded-full p-1">
                                    <Check size={18} className="text-green-500" />
                                </div>
                                <span className="font-medium">
                  Thanks for subscribing! We'll be in touch soon.
                </span>
                            </motion.div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-8 text-center text-sm text-[var(--muted)]"
                    >
                        We respect your privacy. Unsubscribe at any time.
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
