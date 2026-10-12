import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  attemptCookieName,
  attemptCookieValue,
  googleCodeIn,
  googleSignInAddress,
  isAttemptState,
  newSignInAttempt,
  readSignInAttempt,
} from "./sign-in-attempt";

const SETTINGS = {
  clientId: "nomor-uji",
  clientSecret: "rahasia-uji",
  campusEnding: "@kampus.example",
};
const RETURN_ADDRESS = "https://medali.example/masuk/google/kembali";

describe("newSignInAttempt", () => {
  it("makes a state, a nonce and a verifier that differ on every press", () => {
    const first = newSignInAttempt();
    const second = newSignInAttempt();

    const made = [first.state, first.nonce, first.verifier, second.state];
    expect(new Set(made).size).toBe(4);
    expect(made.every(isAttemptState)).toBe(true);
  });
});

describe("isAttemptState", () => {
  it.each([
    [""],
    ["pendek"],
    [`${"a".repeat(42)};`],
    [`${"a".repeat(42)}/`],
    ["a".repeat(44)],
  ])("refuses %o", (text) => {
    expect(isAttemptState(text)).toBe(false);
  });
});

describe("the cookie of an attempt", () => {
  it("is named by the state, so two presses keep one each", () => {
    const first = newSignInAttempt();
    const second = newSignInAttempt();

    expect(attemptCookieName(first.state)).toContain(first.state);
    expect(attemptCookieName(first.state)).not.toBe(
      attemptCookieName(second.state),
    );
  });

  it("gives the attempt back to the state it was kept under", () => {
    const attempt = newSignInAttempt();

    expect(
      readSignInAttempt(attempt.state, attemptCookieValue(attempt)),
    ).toEqual(attempt);
  });

  it.each([
    ["no cookie", undefined],
    ["an empty cookie", ""],
    ["a cookie with one part", "a".repeat(43)],
    ["a cookie with a part that is not random text", `${"a".repeat(43)}.x`],
    ["a cookie with three parts", ["a", "b", "c"].join(".")],
  ])("gives nothing for %s", (_kind, value) => {
    expect(readSignInAttempt(newSignInAttempt().state, value)).toBeNull();
  });

  it("gives nothing for a state that is not random text", () => {
    const attempt = newSignInAttempt();

    expect(readSignInAttempt("../x", attemptCookieValue(attempt))).toBeNull();
  });
});

describe("googleCodeIn", () => {
  it("reads the code Google put in the return address", () => {
    const sent = new URLSearchParams({ code: "4/kode-uji_1", state: "x" });

    expect(googleCodeIn(sent)).toBe("4/kode-uji_1");
  });

  it.each([
    ["no code", {}],
    ["an empty code", { code: "" }],
    ["an error from Google", { error: "access_denied" }],
    ["a code beside an error", { code: "kode", error: "access_denied" }],
    ["a code with a space", { code: "kode uji" }],
    ["a code with a line break", { code: "kode\nuji" }],
    ["a code far too long", { code: "k".repeat(2049) }],
  ])("gives nothing for %s", (_kind, values) => {
    expect(googleCodeIn(new URLSearchParams(values))).toBeNull();
  });
});

describe("googleSignInAddress", () => {
  const attempt = newSignInAttempt();
  const address = new URL(
    googleSignInAddress(SETTINGS, attempt, RETURN_ADDRESS),
  );
  const sent = address.searchParams;

  it("opens Google's own page", () => {
    expect(address.origin + address.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
  });

  it("asks for the address only, and to come back to the app", () => {
    expect(sent.get("scope")).toBe("openid email");
    expect(sent.get("response_type")).toBe("code");
    expect(sent.get("client_id")).toBe("nomor-uji");
    expect(sent.get("redirect_uri")).toBe(RETURN_ADDRESS);
  });

  it("sends the state and the nonce, and only the hash of the verifier", () => {
    const hash = createHash("sha256")
      .update(attempt.verifier)
      .digest("base64url");

    expect(sent.get("state")).toBe(attempt.state);
    expect(sent.get("nonce")).toBe(attempt.nonce);
    expect(sent.get("code_challenge")).toBe(hash);
    expect(sent.get("code_challenge_method")).toBe("S256");
    expect(address.href).not.toContain(attempt.verifier);
  });

  it("hints at the campus, and never sends the secret key", () => {
    expect(sent.get("hd")).toBe("kampus.example");
    expect(address.href).not.toContain("rahasia-uji");
  });
});
