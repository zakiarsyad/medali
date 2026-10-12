import { describe, expect, it } from "vitest";
import {
  removedCookieOptions,
  signInCookieName,
  signInCookieOptions,
} from "./sign-in-cookies";

const SECURE_STAGES = ["pr-preview", "main-preview", "campus"] as const;

describe("signInCookieName", () => {
  it.each(SECURE_STAGES)(
    "has the name only the site itself can set in %s",
    (stage) => {
      expect(signInCookieName("medali-session", stage)).toBe(
        "__Host-medali-session",
      );
    },
  );

  it("is the plain name on a local computer, which has no secure connection", () => {
    expect(signInCookieName("medali-session", "local")).toBe("medali-session");
  });
});

describe("signInCookieOptions", () => {
  it.each(SECURE_STAGES)(
    "keeps a cookie from scripts and from plain connections in %s",
    (stage) => {
      expect(signInCookieOptions(stage)).toEqual({
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
      });
    },
  );

  it("lets a local computer keep it without a secure connection", () => {
    expect(signInCookieOptions("local")).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
  });

  it.each([...SECURE_STAGES, "local"] as const)(
    "names no domain and covers every path in %s, as the protected name needs",
    (stage) => {
      const options = signInCookieOptions(stage);

      expect(options.path).toBe("/");
      expect(options).not.toHaveProperty("domain");
      expect(options).not.toHaveProperty("maxAge");
    },
  );
});

describe("removedCookieOptions", () => {
  it.each([...SECURE_STAGES, "local"] as const)(
    "removes a cookie the way it was set in %s",
    (stage) => {
      expect(removedCookieOptions(stage)).toEqual({
        ...signInCookieOptions(stage),
        maxAge: 0,
      });
    },
  );
});
