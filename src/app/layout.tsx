import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // The keyboard covers the page instead of resizing it, so the canvas does
  // not re-lay itself out every time a field is focused
  interactiveWidget: "resizes-visual",
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
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
