import { describe, expect, it } from "vitest";
import { moveConfirmWords, mustConfirmMove } from "./schedule-move";

const KEPT = { startsOn: "2026-10-15", endsOn: "2026-10-16" };
const MOVED = { startsOn: "2026-10-20", endsOn: "2026-10-21" };

describe("mustConfirmMove", () => {
  it("asks when the first day moves on a schedule with attendances, until that number was agreed to", () => {
    expect(mustConfirmMove(KEPT, MOVED, 3, "")).toBe(true);
    expect(mustConfirmMove(KEPT, MOVED, 3, "3")).toBe(false);
  });

  it("asks when only the last day moves", () => {
    const longer = { ...KEPT, endsOn: "2026-10-17" };

    expect(mustConfirmMove(KEPT, longer, 1, "")).toBe(true);
  });

  it("asks again when the number changed since it was agreed to", () => {
    expect(mustConfirmMove(KEPT, MOVED, 4, "3")).toBe(true);
    expect(mustConfirmMove(KEPT, MOVED, 2, "3")).toBe(true);
  });

  it("does not ask when the dates stay", () => {
    expect(mustConfirmMove(KEPT, { ...KEPT }, 3, "")).toBe(false);
  });

  it("does not ask when the schedule has no attendance yet", () => {
    expect(mustConfirmMove(KEPT, MOVED, 0, "")).toBe(false);
  });

  it("counts anything but the number itself as not agreed", () => {
    for (const agreed of ["", "03", " 3", "tiga", "3.0"]) {
      expect(mustConfirmMove(KEPT, MOVED, 3, agreed)).toBe(true);
    }
  });
});

describe("moveConfirmWords", () => {
  it("names the number of attendances and says to press Simpan perubahan again", () => {
    expect(moveConfirmWords(3)).toBe(
      "Sudah ada 3 presensi masuk untuk jadwal ini. Presensi mahasiswa yang tidak lagi menjadi sasaran, atau jadwal yang belum dimulai, tidak dihitung. Tekan Simpan perubahan lagi untuk melanjutkan.",
    );
  });
});
