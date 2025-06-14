"use client";

import { motion } from "framer-motion";

interface StepCardProps {
  number: number;
  title: string;
  description: string;
}

// Move constants OUTSIDE the component for better perf
const colors = ["#38BDF8", "#EC4899", "#38BDF8"];

export default function StepCard({ number, title, description }: StepCardProps) {
  const backgroundColor = colors[number - 1] || "#E5E7EB"; // fallback to gray-200 if out of range

  return (
    <motion.div
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, rotateZ: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-white font-bold text-xl"
        style={{ backgroundColor }}
        aria-label={`Step ${number}`}
      >
        {number}
      </div>
      <h3 className="text-xl font-semibold text-[#111827] mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>

      {number < 3 && (
        <div className="hidden md:block absolute top-12 right-0 transform translate-x-1/2">
          <svg
            width="40"
            height="12"
            viewBox="0 0 40 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 6H38M38 6L33 1M38 6L33 11" stroke={backgroundColor} strokeWidth="2" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}
