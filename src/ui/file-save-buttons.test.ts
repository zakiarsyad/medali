import { describe, expect, it } from "vitest";
import { isSaveOff } from "./file-save-buttons";

describe("Simpan under a checked file", () => {
  it("is off for a file saved before until the confirm is ticked", () => {
    expect(isSaveOff({ saving: false, warned: true, confirmed: false })).toBe(
      true,
    );
    expect(isSaveOff({ saving: false, warned: true, confirmed: true })).toBe(
      false,
    );
  });

  it("is on for a file not saved before, and off while saving", () => {
    expect(isSaveOff({ saving: false, warned: false, confirmed: false })).toBe(
      false,
    );
    expect(isSaveOff({ saving: true, warned: false, confirmed: false })).toBe(
      true,
    );
  });
});
