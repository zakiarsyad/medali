import { expect, inject, it } from "vitest";
import { readSetting } from "@/settings";

it("points every check at the database the setup picked", () => {
  expect(inject("testDatabaseUrl")).not.toBe("");
  expect(readSetting("DATABASE_URL")).toBe(inject("testDatabaseUrl"));
});
