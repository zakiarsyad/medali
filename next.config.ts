import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The rules for AI tools are in CLAUDE.md. Without this, the dev server
  // writes a second rules file into the repo on every start.
  agentRules: false,
};

export default nextConfig;
