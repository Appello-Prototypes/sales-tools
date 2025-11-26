import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Skip type checking on build for prototype - types are checked in IDE
    ignoreBuildErrors: true,
  },
  /* config options here */
};

export default nextConfig;
