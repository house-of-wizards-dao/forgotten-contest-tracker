import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["postgres"],
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
