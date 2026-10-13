import { describe, expect, it } from "vitest";
import { openedSurveyWords } from "./survey-words";

const TODAY = "2026-10-13";
const TITLE = "Ganjil 2026/2027";

describe("openedSurveyWords", () => {
  it("says the period is open and where students fill in the survey", () => {
    expect(openedSurveyWords({ title: TITLE, startsOn: TODAY }, TODAY)).toBe(
      "Periode evaluasi Ganjil 2026/2027 dibuka. Mahasiswa dapat mengisi survei di Profil saya.",
    );
  });

  it("says the same of a period that started before today", () => {
    const words = openedSurveyWords(
      { title: TITLE, startsOn: "2026-10-01" },
      TODAY,
    );

    expect(words).toContain("dibuka.");
  });

  it("says from which day students can answer when the period starts later", () => {
    const words = openedSurveyWords(
      { title: TITLE, startsOn: "2026-11-01" },
      TODAY,
    );

    expect(words).toBe(
      "Periode evaluasi Ganjil 2026/2027 dijadwalkan. Mahasiswa dapat mengisi survei di Profil saya mulai 1 Nov 2026.",
    );
  });
});
