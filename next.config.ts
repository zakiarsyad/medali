import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The rules for AI tools are in CLAUDE.md. Without this, the dev server
  // writes a second rules file into the repo on every start.
  agentRules: false,
  experimental: {
    // Lets a page refuse an account with a proper "forbidden" answer.
    authInterrupts: true,
    // A student file may be 1 MB, and a sent form adds to that. The file
    // rules still refuse a file over 1 MB, with a message that says so.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
