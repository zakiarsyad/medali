import { describe, expect, it } from "vitest";
import { titleAndUnit } from "./mentor-words";

describe("titleAndUnit", () => {
  it("joins the gelar and the unit", () => {
    expect(titleAndUnit({ title: "M.Si.", unit: "Unit Uji" })).toBe(
      "M.Si. · Unit Uji",
    );
  });

  it("shows the gelar alone for a mentor without a unit", () => {
    expect(titleAndUnit({ title: "M.Si.", unit: null })).toBe("M.Si.");
  });

  it("shows the unit alone for a mentor without a gelar", () => {
    expect(titleAndUnit({ title: "", unit: "Unit Uji" })).toBe("Unit Uji");
  });

  it("is empty when neither is kept", () => {
    expect(titleAndUnit({ title: null, unit: null })).toBe("");
  });
});
