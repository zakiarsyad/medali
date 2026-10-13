import { describe, expect, it } from "vitest";
import { JPEG } from "./file-kinds";

describe("JPEG", () => {
  it("holds bytes that start as a JPEG picture does", () => {
    expect(JPEG.holds(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toBe(
      true,
    );
  });

  it.each([
    ["a PNG picture", [0x89, 0x50, 0x4e, 0x47]],
    ["text", [...new TextEncoder().encode("nim,nama")]],
    ["a start cut short", [0xff, 0xd8]],
    ["nothing", []],
  ])("does not hold %s", (_kind, bytes) => {
    expect(JPEG.holds(new Uint8Array(bytes))).toBe(false);
  });
});
