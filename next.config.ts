import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The rules for AI tools are in CLAUDE.md. Without this, the dev server
  // writes a second rules file into the repo on every start.
  agentRules: false,
  // Lets a page refuse an account with a proper "forbidden" answer.
  experimental: { authInterrupts: true },
};

export default nextConfig;
