import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
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
const APPDROP_APP_URL = "https://www.appdrop.com/app/link-bouquet";
const STANDALONE_REDIRECT_SCRIPT = `
  (function () {
    try {
      if (window.self !== window.top) return;

      var host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1" || host === "::1") return;

      var hasState = Boolean(window.location.search || window.location.hash);
      var target = new URL(hasState ? "${APPDROP_APP_URL}" : "${APPDROP_URL}");

      if (hasState) {
        target.searchParams.set("url", window.location.href);
      }

      window.location.replace(target.toString());
    } catch (error) {}
  })();
`;

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
        <Script
          id="appdrop-standalone-redirect"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: STANDALONE_REDIRECT_SCRIPT }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cecilia.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
