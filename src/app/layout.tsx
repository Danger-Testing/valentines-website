import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Link Bouquet",
  description: "Create and share beautiful bouquets of your favorite links - YouTube videos, Spotify tracks, Instagram posts and more.",
  openGraph: {
    title: "Link Bouquet",
    description: "Create and share beautiful bouquets of your favorite links",
    type: "website",
    siteName: "Link Bouquet",
  },
  twitter: {
    card: "summary_large_image",
    title: "Link Bouquet",
    description: "Create and share beautiful bouquets of your favorite links",
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cecilia.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
