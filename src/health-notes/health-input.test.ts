import { describe, expect, it } from "vitest";
import {
  NO_NOTE,
  NOTE_DAY_IN_FUTURE,
  NOTE_NO_DAY,
  NOTE_TOO_LONG,
  parseNote,
  type SentNote,
  UNKNOWN_CHOICE,
} from "./health-input";

const TODAY = "2026-10-16";

const SENT: SentNote = {
  studentId: "student-1",
  examinedOn: TODAY,
  examiner: " dr. Uji ",
  illnesses: ["asthma", "hypertension"],
  illnessNotes: [" sejak SMP ", ""],
  otherHistory: "",
  medicine: "Inhaler bila perlu",
  advice: "Bawa inhaler saat kegiatan fisik.",
  category: "attention",
};

describe("parseNote", () => {
  it("keeps a filled note, trimmed", () => {
    expect(parseNote(SENT, TODAY)).toEqual({
      ok: true,
      value: {
        studentId: "student-1",
        examinedOn: TODAY,
        examiner: "dr. Uji",
        illnesses: [
          { illness: "asthma", note: "sejak SMP" },
          { illness: "hypertension", note: "" },
        ],
        otherHistory: "",
        medicine: "Inhaler bila perlu",
        advice: "Bawa inhaler saat kegiatan fisik.",
        category: "attention",
      },
    });
  });

  it("keeps an empty Pemeriksa as none, and Ikuti hasil tes kebugaran as no category", () => {
    const parsed = parseNote({ ...SENT, examiner: "  ", category: "" }, TODAY);
    expect(parsed).toMatchObject({
      ok: true,
      value: { examiner: null, category: null },
    });
  });

  it.each<[string, Partial<SentNote>]>([
    ["an illness alone", { otherHistory: "", medicine: "", advice: "" }],
    [
      "Riwayat lain alone",
      {
        illnesses: [],
        illnessNotes: [],
        medicine: "",
        advice: "",
        otherHistory: "Sinusitis",
      },
    ],
    ["Obat alone", { illnesses: [], illnessNotes: [], advice: "" }],
    [
      "Catatan dan rekomendasi alone",
      { illnesses: [], illnessNotes: [], medicine: "" },
    ],
  ])("keeps %s", (_, more) => {
    expect(parseNote({ ...SENT, ...more }, TODAY).ok).toBe(true);
  });

  it("refuses a note with no illness and no text", () => {
    const sent = {
      ...SENT,
      illnesses: [],
      illnessNotes: [],
      otherHistory: " ",
      medicine: "",
      advice: "",
    };
    expect(parseNote(sent, TODAY)).toEqual({ ok: false, error: NO_NOTE });
    expect(NO_NOTE).toBe("Isi riwayat penyakit atau catatan.");
  });

  it("refuses a note with no Tanggal, or one after today", () => {
    expect(parseNote({ ...SENT, examinedOn: "" }, TODAY)).toEqual({
      ok: false,
      error: NOTE_NO_DAY,
    });
    expect(parseNote({ ...SENT, examinedOn: "2026-10-17" }, TODAY)).toEqual({
      ok: false,
      error: NOTE_DAY_IN_FUTURE,
    });
  });

  it.each<[string, Partial<SentNote>]>([
    ["Pemeriksa", { examiner: "a".repeat(201) }],
    ["Riwayat lain", { otherHistory: "a".repeat(201) }],
    ["Obat", { medicine: "a".repeat(201) }],
    ["an illness's note", { illnessNotes: ["a".repeat(201), ""] }],
    ["Catatan dan rekomendasi", { advice: "a".repeat(2001) }],
  ])("refuses %s too long", (_, more) => {
    expect(parseNote({ ...SENT, ...more }, TODAY)).toEqual({
      ok: false,
      error: NOTE_TOO_LONG,
    });
  });

  it("keeps the longest texts allowed", () => {
    const sent = {
      ...SENT,
      examiner: "a".repeat(200),
      advice: "a".repeat(2000),
      illnessNotes: ["a".repeat(200), ""],
    };
    expect(parseNote(sent, TODAY).ok).toBe(true);
  });

  it.each<[string, Partial<SentNote>]>([
    ["an unknown illness", { illnesses: ["flu"], illnessNotes: [""] }],
    ["an illness twice", { illnesses: ["asthma", "asthma"] }],
    ["notes that do not pair with the illnesses", { illnessNotes: [""] }],
    ["Prima as the note's category", { category: "excellent" }],
    ["an unknown category", { category: "berat" }],
  ])("refuses %s", (_, more) => {
    expect(parseNote({ ...SENT, ...more }, TODAY)).toEqual({
      ok: false,
      error: UNKNOWN_CHOICE,
    });
  });
});
