import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", 
  images: {
    unoptimized: true, 
  },
  // Enable React's built-in source tracking in development
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Use custom JSX runtime in development for source tracking (Same.new style)
      config.resolve.alias = {
        ...config.resolve.alias,
        'react/jsx-dev-runtime': require.resolve('./lib/same-runtime/jsx-dev-runtime.js'),
        'react/jsx-runtime': require.resolve('./lib/same-runtime/jsx-runtime.js'),
      };
    }
    return config;
  },
};

export default nextConfig;
