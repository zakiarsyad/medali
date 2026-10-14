import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The rules for AI tools are in CLAUDE.md. Without this, the dev server
  // writes a second rules file into the repo on every start.
  agentRules: false,
  experimental: {
    // Lets a page refuse an account with a proper "forbidden" answer.
    authInterrupts: true,
    // The file of a clarification may be 5 MB, and a sent form adds to
    // that. Every form still refuses its own files by its own limit, with
    // a message that says so: a student file over 1 MB, for one.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
