import { createHash, randomBytes } from "node:crypto";
import type { GoogleSignInSettings } from "@/settings";

/**
 * One press of "Masuk dengan Google", kept in the browser until Google
 * sends the person back. The state ties the return to this press, the
 * nonce ties Google's signed answer to it, and the verifier proves to
 * Google that the same browser finishes what it started.
 */
export interface SignInAttempt {
  state: string;
  nonce: string;
  verifier: string;
}

/** Where Google sends the person back to, below the app's own address. */
export const RETURN_PATH = "/masuk/google/kembali";
/** The attempt's cookie is sent only to the addresses that finish it. */
export const ATTEMPT_COOKIE_PATH = "/masuk/google";
export const ATTEMPT_SECONDS = 10 * 60;

const GOOGLE_PAGE = "https://accounts.google.com/o/oauth2/v2/auth";
const COOKIE_NAME_START = "medali-masuk-";
const RANDOM_BYTES = 32;
const RANDOM_TEXT = /^[A-Za-z0-9_-]{43}$/;

function randomText(): string {
  return randomBytes(RANDOM_BYTES).toString("base64url");
}

export function newSignInAttempt(): SignInAttempt {
  return { state: randomText(), nonce: randomText(), verifier: randomText() };
}

/** Whether a text from the address has the shape of a state made here. */
export function isAttemptState(text: string): boolean {
  return RANDOM_TEXT.test(text);
}

export function attemptCookieName(state: string): string {
  return `${COOKIE_NAME_START}${state}`;
}

export function attemptCookieValue(attempt: SignInAttempt): string {
  return `${attempt.nonce}.${attempt.verifier}`;
}

/**
 * The attempt kept under a state, or null when the state or the cookie is
 * missing or not what the app wrote. Both come from the browser.
 */
export function readSignInAttempt(
  state: string,
  cookieValue: string | undefined,
): SignInAttempt | null {
  if (!isAttemptState(state) || !cookieValue) return null;
  const [nonce = "", verifier = "", ...rest] = cookieValue.split(".");
  if (rest.length > 0) return null;
  if (!RANDOM_TEXT.test(nonce) || !RANDOM_TEXT.test(verifier)) return null;
  return { state, nonce, verifier };
}

function verifierHash(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** Google's own sign-in page, asked for the person's address only. */
export function googleSignInAddress(
  settings: GoogleSignInSettings,
  attempt: SignInAttempt,
  returnAddress: string,
): string {
  const address = new URL(GOOGLE_PAGE);
  address.search = new URLSearchParams({
    client_id: settings.clientId,
    redirect_uri: returnAddress,
    response_type: "code",
    scope: "openid email",
    state: attempt.state,
    nonce: attempt.nonce,
    code_challenge: verifierHash(attempt.verifier),
    code_challenge_method: "S256",
    // Only a hint for Google's page: the app checks the address itself.
    hd: settings.campusEnding.slice(1),
    // Lets someone refused with a private address pick the campus one.
    prompt: "select_account",
  }).toString();
  return address.href;
}
