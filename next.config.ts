import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  // Increase body size limit for the image upload route (default is 4 MB)
  serverExternalPackages: ["cloudinary"],
};

export default nextConfig;
