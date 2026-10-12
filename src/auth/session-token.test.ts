import { describe, expect, it } from "vitest";
import {
  isSessionToken,
  newSessionToken,
  sessionCookieName,
  sessionTokenHash,
} from "./session-token";

describe("sessionCookieName", () => {
  it("is the name only the site itself can set, where the cookie is secure", () => {
    expect(sessionCookieName("campus")).toBe("__Host-medali-session");
    expect(sessionCookieName("main-preview")).toBe("__Host-medali-session");
  });

  it("is the plain name on a local computer", () => {
    expect(sessionCookieName("local")).toBe("medali-session");
  });
});

describe("a session token", () => {
  it("differs every time", () => {
    expect(newSessionToken()).not.toBe(newSessionToken());
  });

  it("has the shape a cookie is checked for", () => {
    expect(isSessionToken(newSessionToken())).toBe(true);
  });

  it.each([[""], ["pendek"], [`${"a".repeat(42)}'`], ["a".repeat(44)]])(
    "is not %o",
    (text) => {
      expect(isSessionToken(text)).toBe(false);
    },
  );

  it("is kept as a hash that does not hold it", () => {
    const token = newSessionToken();
    const hash = sessionTokenHash(token);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(sessionTokenHash(token)).toBe(hash);
    expect(sessionTokenHash(newSessionToken())).not.toBe(hash);
  });
});
