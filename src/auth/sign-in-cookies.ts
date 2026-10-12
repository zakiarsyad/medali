import type { Stage } from "@/settings";

/**
 * A browser takes a cookie whose name starts like this only from the
 * site itself, over a secure connection, for every path. Another site
 * under the same campus name can then not plant one.
 */
const OWN_SITE_ONLY = "__Host-";

/** A local computer has no secure connection; everywhere else has. */
function isSecure(stage: Stage): boolean {
  return stage !== "local";
}

/** The name a cookie of sign-in goes by in the browser. */
export function signInCookieName(name: string, stage: Stage): string {
  return isSecure(stage) ? `${OWN_SITE_ONLY}${name}` : name;
}

/**
 * How the cookies of sign-in are kept: out of reach of scripts, and sent
 * only over a secure connection. `lax` still sends them when Google
 * brings the person back to the app. The path is the whole site, which
 * the protected name requires.
 */
export function signInCookieOptions(stage: Stage) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure(stage),
    path: "/",
  } as const;
}

/**
 * How a cookie of sign-in is removed. A browser ignores the removal of a
 * cookie with the protected name unless it is sent like the cookie was.
 */
export function removedCookieOptions(stage: Stage) {
  return { ...signInCookieOptions(stage), maxAge: 0 } as const;
}
