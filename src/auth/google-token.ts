import { errors, type JWTPayload, type JWTVerifyGetKey, jwtVerify } from "jose";

/** An address as Google confirmed it, in small letters. */
export interface ConfirmedAddress {
  email: string;
  /** Whether Google says the address really belongs to the person. */
  verified: boolean;
  /**
   * The campus or company that runs the account at Google, in small
   * letters. Null for a personal Google account, which names none.
   */
  hostedDomain: string | null;
}

/** What an answer must name to belong to this app and this attempt. */
export interface ExpectedToken {
  clientId: string;
  nonce: string;
}

const GOOGLE_NAMES = ["https://accounts.google.com", "accounts.google.com"];

/**
 * The content of an answer, only when it is signed by Google, made for
 * this app, and not expired. Anything else gives null.
 */
async function trustedContent(
  token: string,
  keys: JWTVerifyGetKey,
  clientId: string,
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: GOOGLE_NAMES,
      audience: clientId,
      algorithms: ["RS256"],
      requiredClaims: ["exp"],
    });
    return payload;
  } catch (error) {
    // The library says why it refuses an answer; anything else is a fault.
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }
}

/**
 * Reads the address out of Google's signed answer, or null when the
 * answer cannot be trusted or was not made for this attempt.
 */
export async function readGoogleToken(
  token: string,
  keys: JWTVerifyGetKey,
  expected: ExpectedToken,
): Promise<ConfirmedAddress | null> {
  const content = await trustedContent(token, keys, expected.clientId);
  if (!content) return null;
  if (content.nonce !== expected.nonce) return null;
  if (typeof content.email !== "string") return null;
  return {
    email: content.email.toLowerCase(),
    verified: content.email_verified === true,
    hostedDomain:
      typeof content.hd === "string" ? content.hd.toLowerCase() : null,
  };
}
