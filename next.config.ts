import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The rules for AI tools are in CLAUDE.md. Without this, the dev server
  // writes a second rules file into the repo on every start.
  agentRules: false,
  experimental: {
    // Lets a page refuse an account with a proper "forbidden" answer.
    authInterrupts: true,
    // The preview hosting refuses a send over 4.5 MB before the app sees
    // it, so the campus server refuses the same sends: what works on the
    // preview works on campus. Every form still refuses its own files by
    // its own limit, at most 4 MB, with a message that says so.
    serverActions: { bodySizeLimit: 4_500_000 },
  },
};

export default nextConfig;
