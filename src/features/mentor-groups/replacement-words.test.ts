import { describe, expect, it } from "vitest";
import { type ConfirmedChange, confirmWords } from "./replacement-words";

const CHANGE: ConfirmedChange = {
  members: 1234,
  groupCode: "KP 25-D3PJK-01",
  oldMentorName: "Pengasuh Uji Lama",
  newMentorName: "Pengasuh Uji Baru",
  startsOn: "2026-11-02",
  today: "2026-10-13",
};

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
