import { describe, expect, it } from "vitest";
import {
  type ConfirmedChange,
  confirmWords,
  savedReplacementWords,
} from "./replacement-words";
import type { SavedReplacement } from "./save-replacement";

const CHANGE: ConfirmedChange = {
  members: 1234,
  groupCode: "KP 25-D3PJK-01",
  oldMentorName: "Pengasuh Uji Lama",
  newMentorName: "Pengasuh Uji Baru",
  startsOn: "2026-11-02",
  today: "2026-10-13",
};

const SAVED: SavedReplacement = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f4a01",
  group: {
    cohortYear: 2025,
    entryPath: "regular",
    number: 1,
    programCode: "D3PJK",
  },
  newMentorName: "Pengasuh Uji Baru",
  startsOn: "2026-11-02",
  isInForce: false,
};

describe("savedReplacementWords", () => {
  it("says from which day a replacement for a later date is scheduled", () => {
    expect(savedReplacementWords(SAVED)).toBe(
      "Penggantian dijadwalkan mulai 2 Nov 2026.",
    );
  });

  it("says who holds the group now once it is in force", () => {
    expect(savedReplacementWords({ ...SAVED, isInForce: true })).toBe(
      "Pengasuh KP 25-D3PJK-01 kini Pengasuh Uji Baru.",
    );
  });
});

describe("confirmWords", () => {
  it("names the students, the group, both mentors and the day", () => {
    expect(confirmWords(CHANGE)).toBe(
      "Seluruh 1.234 mahasiswa KP 25-D3PJK-01 beralih dari Pengasuh Uji Lama ke Pengasuh Uji Baru mulai 2 Nov 2026. Catatan pengasuhan sebelumnya tetap tersimpan atas nama pengasuh lama.",
    );
  });

  it("says pengasuh pengganti while no spare mentor is chosen", () => {
    const words = confirmWords({ ...CHANGE, newMentorName: null });

    expect(words).toContain("ke pengasuh pengganti mulai 2 Nov 2026.");
  });

  it("names today while the field holds no day", () => {
    expect(confirmWords({ ...CHANGE, startsOn: "" })).toContain(
      "mulai 13 Okt 2026.",
    );
    expect(confirmWords({ ...CHANGE, startsOn: "2026-02-30" })).toContain(
      "mulai 13 Okt 2026.",
    );
  });
});
