import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Viewport } from "next";
import React, { useEffect } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "./providers";
import { Analytics } from "./analytics";
// We'll handle the EnableMock component in a client component instead

// Initialize monitoring in production using dynamic import to avoid ESM/CJS conflicts
if (process.env.NODE_ENV === 'production') {
  // Use dynamic import to avoid ESM/CJS conflicts during build time
  import("@/lib/monitoring").then(({ initMonitoring }) => {
    initMonitoring();
  }).catch(error => {
    console.warn("Failed to initialize monitoring:", error);
  });
}

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
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
          className={`${inter.variable} ${robotoMono.variable} antialiased font-sans bg-white text-gray-900`}
        >
          {/* EnableMock component removed to fix SSR issues */}
          <Providers>
            {children}
            <Analytics />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
