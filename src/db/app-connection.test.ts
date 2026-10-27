import { describe, expect, it } from "vitest";
import { appConnectionOf, sharedConnectionAddress } from "./app-connection";

const NEON =
  "postgres://medali:p%40ss@ep-quiet-sea-a1b2c3.ap-southeast-1.aws.neon.tech/medali?sslmode=require";
const NEON_POOLED =
  "postgres://medali:p%40ss@ep-quiet-sea-a1b2c3-pooler.ap-southeast-1.aws.neon.tech/medali?sslmode=require";
const CAMPUS = "postgres://medali:secret@db:5432/medali";

describe("sharedConnectionAddress", () => {
  it("adds -pooler to the endpoint of a database service address", () => {
    expect(sharedConnectionAddress(NEON)).toBe(NEON_POOLED);
  });

  it("keeps an address that is already the shared one", () => {
    expect(sharedConnectionAddress(NEON_POOLED)).toBe(NEON_POOLED);
  });

  it.each([
    [CAMPUS],
    ["postgres://medali@localhost:5432/medali"],
    ["postgres://u@ep-x.example.com/medali"],
    ["postgres://u@db.neon.tech/medali"],
  ])("keeps %s, which is not at the database service", (url) => {
    expect(sharedConnectionAddress(url)).toBe(url);
  });
});

describe("appConnectionOf", () => {
  it.each([["pr-preview" as const], ["main-preview" as const]])(
    "on the %s uses the shared address with few connections that close when idle",
    (stage) => {
      expect(appConnectionOf(NEON, stage)).toEqual({
        url: NEON_POOLED,
        limits: { max: 5, idleTimeoutSeconds: 10 },
      });
    },
  );

  it.each([["campus" as const], ["local" as const]])(
    "on %s keeps the address and the default connections",
    (stage) => {
      expect(appConnectionOf(CAMPUS, stage)).toEqual({ url: CAMPUS });
    },
  );
});
