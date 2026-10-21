import { describe, expect, it } from "vitest";
import { senderMessageOf } from "./penalty-assignment-rules";

describe("Pesan untuk konselor of a Penugasan", () => {
  it("keeps what was typed without the spaces around it", () => {
    expect(senderMessageOf("  Mohon pendampingan.\n")).toBe(
      "Mohon pendampingan.",
    );
  });

  it("keeps none when nothing but spaces was typed", () => {
    expect(senderMessageOf("")).toBeNull();
    expect(senderMessageOf("   ")).toBeNull();
  });
});
