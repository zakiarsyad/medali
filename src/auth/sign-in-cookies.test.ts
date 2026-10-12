import { describe, expect, it } from "vitest";
import { signInCookieOptions } from "./sign-in-cookies";

describe("signInCookieOptions", () => {
  it.each(["pr-preview", "main-preview", "campus"] as const)(
    "keeps a cookie from scripts and from plain connections in %s",
    (stage) => {
      expect(signInCookieOptions(stage)).toEqual({
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      });
    },
  );

  it("lets a local computer, which has no secure connection, keep it", () => {
    expect(signInCookieOptions("local")).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
  });
});
