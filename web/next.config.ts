import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false, // 🔥 disable buggy feature
  },
};

export default nextConfig;