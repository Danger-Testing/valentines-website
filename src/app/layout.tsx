import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { ExternalLink } from "lucide-react";
import "./globals.css";
import { cecilia } from "./fonts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APPDROP_URL = "https://www.appdrop.com/marcgmbh/link-bouquet";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Link Bouquet",
  description: "Create and share beautiful bouquets of your favorite links - YouTube videos, Spotify tracks, Instagram posts and more.",
  metadataBase: new URL("https://linkbouquet.com"),
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Link Bouquet",
    description: "Create and share beautiful bouquets of your favorite links",
    type: "website",
    siteName: "Link Bouquet",
    url: "https://linkbouquet.com",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Link Bouquet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Link Bouquet",
    description: "Create and share beautiful bouquets of your favorite links",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/rpg0yth.css" />
        <Script
          src="https://www.appdrop.com/appdrop-sdk.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cecilia.variable} antialiased`}
      >
        {children}
        <Analytics />
        <a
          href={APPDROP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Link Bouquet on Appdrop"
          className="fixed left-1/2 top-4 z-50 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-lg bg-white/60 px-3 py-2 text-xs font-medium text-black shadow-sm backdrop-blur-md transition hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-black/30 md:top-6"
        >
          <span>Appdrop</span>
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      </body>
    </html>
  );
}
