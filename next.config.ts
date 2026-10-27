import type { NextConfig } from "next";
import { SENT_FORM_MAX_BYTES } from "./src/files/sent-form-size";

const nextConfig: NextConfig = {
  // The rules for AI tools are in CLAUDE.md. Without this, the dev server
  // writes a second rules file into the repo on every start.
  agentRules: false,
  experimental: {
    // Lets a page refuse an account with a proper "forbidden" answer.
    authInterrupts: true,
    // Kept within what the preview hosting takes in one send, so what
    // works on the preview works on campus. Every form still refuses
    // its own files by its own limit, at most 4 MB, with a message that
    // says so.
    serverActions: { bodySizeLimit: SENT_FORM_MAX_BYTES },
  },
};

export default nextConfig;
