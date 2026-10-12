import { createHash, randomBytes } from "node:crypto";
import type { Stage } from "@/settings";
import { signInCookieName } from "./sign-in-cookies";

/** The name of the cookie that holds the token of a Google session. */
export function sessionCookieName(stage: Stage): string {
  return signInCookieName("medali-session", stage);
}

const TOKEN_BYTES = 32;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** The random text a signed-in browser holds. It is never kept as it is. */
export function newSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Whether a text from a cookie has the shape of a token made here. */
export function isSessionToken(text: string): boolean {
  return TOKEN.test(text);
}

/** What the database keeps of a token: enough to find it, not to use it. */
export function sessionTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
