import type { Stage } from "@/settings";

/**
 * How the cookies of sign-in are kept: out of reach of scripts, and sent
 * only over a secure connection. `lax` still sends them when Google
 * brings the person back to the app.
 */
export function signInCookieOptions(stage: Stage) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: stage !== "local",
  } as const;
}
