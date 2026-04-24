import type { NextConfig } from "next";
import path from "path";

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
  // Fix workspace root so Next.js doesn't pick up parent-directory lockfiles
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
