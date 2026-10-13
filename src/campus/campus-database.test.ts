import { describe, expect, it } from "vitest";
import { checkCampusDatabase } from "./campus-database";

describe("checkCampusDatabase", () => {
  it("goes on with a database marked as the campus one", () => {
    expect(checkCampusDatabase("campus")).toBe("go");
  });

  it("marks a database that carries no mark yet", () => {
    expect(checkCampusDatabase(null)).toBe("mark-and-go");
  });

  it.each(["pr-preview", "main-preview"] as const)(
    "refuses a database marked %s: it holds sample data",
    (marker) => {
      expect(() => checkCampusDatabase(marker)).toThrow(marker);
    },
  );
});
