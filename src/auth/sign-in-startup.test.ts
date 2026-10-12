import { describe, expect, it } from "vitest";
import { checkSignInAtStartup } from "./sign-in-startup";

const CAMPUS = { NODE_ENV: "production" };
const FILLED = {
  GOOGLE_CLIENT_ID: "nomor-uji",
  GOOGLE_CLIENT_SECRET: "rahasia-uji",
  CAMPUS_EMAIL_ENDING: "@kampus.example",
};
const NAMES = Object.keys(FILLED) as (keyof typeof FILLED)[];

function refusalOf(env: Record<string, string>): string {
  try {
    checkSignInAtStartup(env);
  } catch (error) {
    if (error instanceof Error) return error.message;
  }
  throw new Error("The app was let to start.");
}

describe("checkSignInAtStartup", () => {
  it("lets the campus server start with all three settings filled", () => {
    expect(() => checkSignInAtStartup({ ...CAMPUS, ...FILLED })).not.toThrow();
  });

  it.each(NAMES)(
    "refuses to start the campus server without %s, and names it alone",
    (name) => {
      const refusal = refusalOf({ ...CAMPUS, ...FILLED, [name]: "" });

      expect(refusal).toContain("refused to start");
      for (const other of NAMES) {
        expect(refusal.includes(other)).toBe(other === name);
      }
    },
  );

  it("names all three when none is filled", () => {
    const refusal = refusalOf(CAMPUS);

    for (const name of NAMES) expect(refusal).toContain(name);
  });

  it("refuses a campus ending that is only spaces", () => {
    const refusal = refusalOf({
      ...CAMPUS,
      ...FILLED,
      CAMPUS_EMAIL_ENDING: " ",
    });

    expect(refusal).toContain("CAMPUS_EMAIL_ENDING");
  });

  it("never shows a value of a setting", () => {
    const refusal = refusalOf({ ...CAMPUS, ...FILLED, GOOGLE_CLIENT_ID: "" });

    expect(refusal).not.toContain("rahasia-uji");
    expect(refusal).not.toContain("kampus.example");
  });

  it.each([
    [{ NODE_ENV: "development" }, "a local computer"],
    [{ VERCEL_ENV: "preview" }, "a PR preview"],
    [{ VERCEL_ENV: "production" }, "the preview of main"],
  ])("lets %o start with none filled: %s has Ganti peran", (env, _where) => {
    expect(() => checkSignInAtStartup(env)).not.toThrow();
  });

  it("lets a preview start with only some filled", () => {
    const partly = { VERCEL_ENV: "production", GOOGLE_CLIENT_ID: "nomor-uji" };

    expect(() => checkSignInAtStartup(partly)).not.toThrow();
  });
});
