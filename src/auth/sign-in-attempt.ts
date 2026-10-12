import { createHash, randomBytes } from "node:crypto";
import type { GoogleSignInSettings, Stage } from "@/settings";
import { signInCookieName } from "./sign-in-cookies";

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
export const ATTEMPT_SECONDS = 10 * 60;

const GOOGLE_PAGE = "https://accounts.google.com/o/oauth2/v2/auth";
const COOKIE_NAME_START = "medali-masuk-";
const RANDOM_BYTES = 32;
const RANDOM_TEXT = /^[A-Za-z0-9_-]{43}$/;
/** Visible characters only, and far longer than any code Google gives. */
const GOOGLE_CODE = /^[\x21-\x7e]{1,2048}$/;

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

export function attemptCookieName(state: string, stage: Stage): string {
  return signInCookieName(`${COOKIE_NAME_START}${state}`, stage);
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

/**
 * The code Google put in the return address, or null: when the person
 * cancelled or Google reports an error there is none, and a text of
 * another shape is not one.
 */
export function googleCodeIn(sent: URLSearchParams): string | null {
  const code = sent.get("code");
  if (sent.has("error") || !code) return null;
  return GOOGLE_CODE.test(code) ? code : null;
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
