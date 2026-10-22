import { describe, expect, it } from "vitest";
import { menteeLede, NO_GROUP_HELD } from "./mentee-words";

const KP_26 = {
  id: "a",
  cohortYear: 2026,
  entryPath: "regular",
  number: 1,
  programCode: "D3PJK",
} as const;

describe("the line under Dashboard anak asuh", () => {
  it("names how many anak asuh, the groups and their angkatan", () => {
    expect(menteeLede({ students: 12, groups: [KP_26] })).toBe(
      "Empat aspek penilaian 12 anak asuh Anda di KP 26-D3PJK-01, angkatan 2026.",
    );
  });

  it("names each group and each angkatan once, for a Pengasuh of several", () => {
    const groups = [
      KP_26,
      { ...KP_26, id: "b", number: 2 },
      { ...KP_26, id: "c", cohortYear: 2025 },
    ];

    expect(menteeLede({ students: 30, groups })).toBe(
      "Empat aspek penilaian 30 anak asuh Anda di KP 26-D3PJK-01, KP 26-D3PJK-02, KP 25-D3PJK-01, angkatan 2026, 2025.",
    );
  });

  it("tells a Pengasuh without a group when the data will show", () => {
    expect(NO_GROUP_HELD).toBe(
      "Anda belum memegang kelompok pengasuhan. Data akan tampil setelah Kepala Unit menugaskan kelompok kepada Anda.",
    );
  });
});
