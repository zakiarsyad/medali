import { describe, expect, it } from "vitest";
import { parseKeepDays } from "./keep-days-input";

const REFUSED = {
  ok: false,
  error: "Lama simpan harus bilangan bulat 30–3650 hari.",
};

describe("parseKeepDays", () => {
  it.each([
    ["30", 30],
    ["365", 365],
    ["3650", 3650],
    [" 180 ", 180],
    ["0090", 90],
  ])("takes %j as %i", (sent, days) => {
    expect(parseKeepDays(sent)).toEqual({ ok: true, value: days });
  });

  it.each([
    ["an empty field", ""],
    ["spaces only", "   "],
    ["a number below 30", "29"],
    ["a number above 3650", "3651"],
    ["a negative number", "-30"],
    ["a fraction", "30.5"],
    ["a decimal comma", "30,5"],
    ["words", "tiga puluh"],
    ["a very long number", "00000030"],
  ])("refuses %s", (_case, sent) => {
    expect(parseKeepDays(sent)).toEqual(REFUSED);
  });
});
