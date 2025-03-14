import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    };
    return config;
  },
  // Moved from experimental.serverComponentsExternalPackages to top level
  serverExternalPackages: ['@prisma/client'],
  experimental: {
    // Empty experimental object or remove if not needed
  }
};

export default nextConfig;