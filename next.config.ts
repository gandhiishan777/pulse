import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the tracking script to be loaded cross-origin
  async headers() {
    return [
      {
        source: "/tracking.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
