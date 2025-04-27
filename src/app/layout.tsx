import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Viewport } from "next";
import React from "react";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "ChatterSphere | Connect Through Meaningful Conversations",
  description: "ChatterSphere helps you build meaningful connections through real-time chat, thriving community, and global interactions in a secure environment.",
  keywords: ["chat platform", "communities", "messaging", "social network"],
  authors: [{ name: "ChatterSphere Team" }],
  creator: "ChatterSphere",
  publisher: "ChatterSphere",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chattersphere.example.com",
    title: "ChatterSphere | Connect Through Meaningful Conversations",
    description: "Build meaningful connections through real-time chat and thriving community.",
    siteName: "ChatterSphere",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ChatterSphere - Connect Through Meaningful Conversations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatterSphere | Connect Through Meaningful Conversations",
    description: "Build meaningful connections through real-time chat and thriving community.",
    images: ["/twitter-image.png"],
  },
  verification: {
    google: "google-site-verification-code",
    yandex: "yandex-verification-code",
  },
  category: "Social Networking",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#38BDF8", // Stay light only
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en" className="scroll-smooth">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-white text-gray-900`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
