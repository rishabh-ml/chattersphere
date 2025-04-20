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
  title: "ChatterSphere | Connect Through Meaningful Conversations",
  description: "ChatterSphere helps you build meaningful connections through real-time chat, thriving communities, and global interactions in a secure environment.",
  keywords: ["chat platform", "communities", "messaging", "social network"],
  authors: [{ name: "ChatterSphere Team" }],
  creator: "ChatterSphere",
  publisher: "ChatterSphere",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chattersphere.example.com",
    title: "ChatterSphere | Connect Through Meaningful Conversations",
    description: "Build meaningful connections through real-time chat and thriving communities.",
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
    description: "Build meaningful connections through real-time chat and thriving communities.",
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
        <head>
          <title>ChatterSphere | Connect Through Meaningful Conversations</title>
          <link rel="icon" type="image/png" href="/icon1.png" sizes="96x96" />
          <link rel="icon" type="image/svg+xml" href="/icon0.svg" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <meta name="apple-mobile-web-app-title" content="ChatterSphere" />
          <link rel="manifest" href="/manifest" />
        </head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-white text-gray-900`}
        >
        {children}
        </body>
        </html>
      </ClerkProvider>
  );
}
