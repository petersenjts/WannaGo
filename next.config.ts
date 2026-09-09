import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal, self-contained build output for the Docker image.
  output: "standalone",
};

export default nextConfig;
