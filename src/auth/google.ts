import { createRemoteJWKSet } from "jose";
import type { GoogleSignInSettings } from "@/settings";
import type { AddressConfirmer, CodeExchange } from "./finish-sign-in";
import { readGoogleToken } from "./google-token";

const TOKEN_ADDRESS = "https://oauth2.googleapis.com/token";
const KEYS_ADDRESS = "https://www.googleapis.com/oauth2/v3/certs";
const WAIT_MILLISECONDS = 10_000;

/** Google's published keys. The library fetches them once and keeps them. */
const googleKeys = createRemoteJWKSet(new URL(KEYS_ADDRESS));

function signedAnswerIn(content: unknown): string | null {
  if (typeof content !== "object" || content === null) return null;
  if (!("id_token" in content)) return null;
  return typeof content.id_token === "string" ? content.id_token : null;
}

/** Hands the code to Google, and gets its signed answer or null. */
async function signedAnswer(
  settings: GoogleSignInSettings,
  exchange: CodeExchange,
): Promise<string | null> {
  const answer = await fetch(TOKEN_ADDRESS, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: exchange.code,
      code_verifier: exchange.verifier,
      redirect_uri: exchange.returnAddress,
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
    }),
    signal: AbortSignal.timeout(WAIT_MILLISECONDS),
  });
  if (!answer.ok) return null;
  return signedAnswerIn(await answer.json());
}

/** The real Google, asked over the network. */
export function googleOf(settings: GoogleSignInSettings): AddressConfirmer {
  return {
    async confirmAddress(exchange) {
      try {
        const token = await signedAnswer(settings, exchange);
        if (!token) return null;
        return await readGoogleToken(token, googleKeys, {
          clientId: settings.clientId,
          nonce: exchange.nonce,
        });
      } catch (error) {
        // Google out of reach is not the person's mistake: they are told
        // to try again. Only the kind of fault is logged, because the
        // fault itself may quote what was sent, which holds the keys.
        const kind = error instanceof Error ? error.name : "unknown";
        console.error(`Google could not be asked about a sign-in: ${kind}.`);
        return null;
      }
    },
  };
}
