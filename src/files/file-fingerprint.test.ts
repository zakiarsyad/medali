import { describe, expect, it } from "vitest";
import { fingerprintOf } from "./file-fingerprint";

describe("fingerprintOf", () => {
  it("gives the SHA-256 of the bytes in hex, the same for the same content", () => {
    const bytes = new TextEncoder().encode("abc");

    expect(fingerprintOf(bytes)).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(fingerprintOf(new TextEncoder().encode("abd"))).not.toBe(
      fingerprintOf(bytes),
    );
  });
});
