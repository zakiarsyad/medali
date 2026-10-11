import { describe, expect, it } from "vitest";
import { activityNote, ticksOfValues, toggled } from "./ppks-activities";

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

describe("toggled", () => {
  it("puts in what is not in the list", () => {
    expect(toggled(["M"], "D")).toEqual(["M", "D"]);
  });

  it("takes out what is in the list", () => {
    expect(toggled(["M", "D"], "M")).toEqual(["D"]);
  });
});

describe("ticksOfValues", () => {
  it("drops the ticks of a nilai that is no longer chosen", () => {
    expect(ticksOfValues(["M1", "D2", "M4"], ["D"])).toEqual(["D2"]);
  });

  it("keeps every tick while its nilai stays chosen", () => {
    expect(ticksOfValues(["M1", "D2"], ["M", "D", "I"])).toEqual(["M1", "D2"]);
  });
});
