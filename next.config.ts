import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silencia o aviso de múltiplos lockfiles no workspace
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
