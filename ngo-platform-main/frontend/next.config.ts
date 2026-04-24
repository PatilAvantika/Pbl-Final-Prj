import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Baked into the client bundle when unset — avoids calling port 3000 while API runs on 3002 */
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
