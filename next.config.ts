import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "192.168.1.159"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.instagram.com",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
    ],
  },
};

export default nextConfig;
