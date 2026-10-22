import { describe, expect, it } from "vitest";
import { assignmentBasis } from "./assignment-basis";

describe("Dasar of a Penugasan from a discipline penalty", () => {
  it("names the Kategori and Jenjang only", () => {
    expect(assignmentBasis("medium", 1)).toBe(
      "Pelanggaran disiplin sedang jenjang pertama",
    );
    expect(assignmentBasis("light", 3)).toBe(
      "Pelanggaran disiplin ringan jenjang ketiga",
    );
    expect(assignmentBasis("heavy", 2)).toBe(
      "Pelanggaran disiplin berat jenjang kedua",
    );
  });
});
