import { describe, expect, it } from "vitest";
import { activityNote } from "./ppks-activities";

describe("activityNote", () => {
  it("gives the description alone for a required activity", () => {
    expect(activityNote("Latihan uji.", true)).toBe("Latihan uji.");
  });

  it("adds tidak wajib for an activity that is not required", () => {
    expect(activityNote("Latihan uji.", false)).toBe(
      "Latihan uji. · tidak wajib",
    );
  });

  it("gives only tidak wajib when there is no description", () => {
    expect(activityNote("", false)).toBe("tidak wajib");
  });

  it("gives nothing for a required activity with no description", () => {
    expect(activityNote("", true)).toBe("");
  });
});
