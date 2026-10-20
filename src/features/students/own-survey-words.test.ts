import { describe, expect, it } from "vitest";
import {
  answeredWords,
  PRIVACY_WORDS,
  SCALE_KEY,
  surveyPeriodWords,
} from "./own-survey-words";

describe("the words of the survey on Profil saya", () => {
  it("names the period and its last day", () => {
    expect(
      surveyPeriodWords({
        periodTitle: "Ganjil 2026/2027",
        endsOn: "2026-11-03",
      }),
    ).toBe("Periode evaluasi Ganjil 2026/2027 · dibuka sampai 3 Nov 2026");
  });

  it("gives the key of the scores from 1 to 5", () => {
    expect(SCALE_KEY).toBe(
      "1 = Sangat tidak setuju · 2 = Tidak setuju · 3 = Netral · 4 = Setuju · 5 = Sangat setuju",
    );
  });

  it("says no answer is shown per person, who sees the recap, and when suggestions show", () => {
    expect(PRIVACY_WORDS).toContain("tidak ditampilkan per orang");
    expect(PRIVACY_WORDS).toContain(
      "Kepala Unit, Direktur / Wakil Direktur, Pegawai UPK, dan Ketua Program Studi hanya melihat rekap kelompok",
    );
    expect(PRIVACY_WORDS).toContain(
      "saran ditampilkan tanpa nama bila responden kelompok minimal 3 orang",
    );
  });

  it("counts the statements answered out of eight", () => {
    expect(answeredWords(3)).toBe("3 dari 8 pernyataan dijawab");
  });
});
