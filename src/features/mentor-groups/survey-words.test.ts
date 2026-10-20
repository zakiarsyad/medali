import { describe, expect, it } from "vitest";
import {
  CLOSE_QUESTION,
  cancelQuestion,
  endChangedWords,
  openedSurveyWords,
  respondentWords,
  surveyDaysWords,
  weightWords,
} from "./survey-words";

const TODAY = "2026-10-13";
const TITLE = "Ganjil 2026/2027";

describe("the questions before a period is closed or cancelled", () => {
  it("says what closing does to the students", () => {
    expect(CLOSE_QUESTION).toBe(
      "Tutup periode evaluasi sekarang? Mahasiswa tidak dapat mengisi survei lagi.",
    );
  });

  it("asks about a cancel without a number while no answer came in", () => {
    expect(cancelQuestion(0)).toBe("Batalkan periode ini?");
  });

  it("names the answers that came in, which will not be used", () => {
    expect(cancelQuestion(3)).toBe(
      "Batalkan periode ini? 3 jawaban survei yang sudah masuk tidak akan dipakai.",
    );
    expect(cancelQuestion(1250)).toBe(
      "Batalkan periode ini? 1.250 jawaban survei yang sudah masuk tidak akan dipakai.",
    );
  });
});

describe("endChangedWords", () => {
  it("names the new last day", () => {
    expect(endChangedWords("2026-10-31")).toBe(
      "Tanggal ditutup diubah menjadi 31 Okt 2026.",
    );
  });
});

describe("surveyDaysWords", () => {
  it("names the first and the last day and who opened the period", () => {
    const words = surveyDaysWords({
      startsOn: "2026-10-13",
      endsOn: "2026-10-27",
      openerName: "Kepala Uji",
    });

    expect(words).toBe(
      "13 Okt 2026 sampai 27 Okt 2026 · dibuka oleh Kepala Uji",
    );
  });
});

describe("respondentWords", () => {
  it("shows how many of the students who can answer did, with the share rounded", () => {
    expect(respondentWords(7, 28)).toBe("7 dari 28 (25%)");
    expect(respondentWords(1, 3)).toBe("1 dari 3 (33%)");
    expect(respondentWords(0, 28)).toBe("0 dari 28 (0%)");
  });

  it("shows no share when no student can answer", () => {
    expect(respondentWords(0, 0)).toBe("0 dari 0");
  });

  it("writes a large number the Indonesian way", () => {
    expect(respondentWords(1000, 1250)).toBe("1.000 dari 1.250 (80%)");
  });
});

describe("weightWords", () => {
  it("shows both weights, the second as the rest of 100", () => {
    expect(weightWords(50)).toBe("Capaian 50% · umpan balik 50%");
    expect(weightWords(70)).toBe("Capaian 70% · umpan balik 30%");
    expect(weightWords(0)).toBe("Capaian 0% · umpan balik 100%");
  });
});

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
