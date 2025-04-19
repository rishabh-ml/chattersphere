// layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";

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

export const metadata = {
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#38BDF8" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <title>{metadata.title}</title>
        <link rel="icon" type="image/png" href="/icon1.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/icon0.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="ChatterSphere" />
        <link rel="manifest" href="/manifest" />
        {/* Added script to prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}