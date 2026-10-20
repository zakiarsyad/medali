import { describe, expect, it } from "vitest";
import type { HealthNote } from "@/health-notes/health-ids";
import type { NoteInput } from "@/health-notes/health-input";
import { repeatsLatestNote, savesNote } from "./dorm-health-save-rules";

const LATEST: HealthNote = {
  id: "note",
  examinedOn: "2026-10-01",
  examiner: "Klinik kampus",
  illnesses: [
    { illness: "asthma", note: "sejak SMP" },
    { illness: "allergy", note: "" },
  ],
  otherHistory: "",
  medicine: "Inhaler bila perlu",
  advice: "Bawa inhaler.",
  category: "attention",
  savedBy: "BAM Kesehatan",
};

/** The form as it is filled from the latest note, Pemeriksa left empty. */
const FILLED: NoteInput = {
  studentId: "student",
  examinedOn: "2026-10-16",
  examiner: null,
  illnesses: [
    { illness: "allergy", note: "" },
    { illness: "asthma", note: "sejak SMP" },
  ],
  otherHistory: "",
  medicine: "Inhaler bila perlu",
  advice: "Bawa inhaler.",
  category: "attention",
};

describe("repeatsLatestNote", () => {
  it("is true for the form as filled from the latest note, whatever its Tanggal", () => {
    expect(repeatsLatestNote(FILLED, LATEST)).toBe(true);
  });

  it.each<[string, Partial<NoteInput>]>([
    ["a Pemeriksa typed", { examiner: "dr. Sari" }],
    [
      "an illness more",
      { illnesses: [...FILLED.illnesses, { illness: "epilepsy", note: "" }] },
    ],
    [
      "an illness's note changed",
      {
        illnesses: [
          { illness: "asthma", note: "kambuh" },
          { illness: "allergy", note: "" },
        ],
      },
    ],
    ["Riwayat lain", { otherHistory: "Sinusitis" }],
    ["Obat", { medicine: "" }],
    ["Catatan dan rekomendasi", { advice: "Istirahat." }],
    ["Pertimbangan kategori", { category: null }],
  ])("is false with %s", (_, change) => {
    expect(repeatsLatestNote({ ...FILLED, ...change }, LATEST)).toBe(false);
  });

  it("is false for a student with no note yet", () => {
    expect(repeatsLatestNote(FILLED, undefined)).toBe(false);
  });
});

describe("savesNote", () => {
  it("saves no note when the note part is empty", () => {
    expect(
      savesNote({ noteEmpty: true, repeatsLatest: false, markDecides: true }),
    ).toBe(false);
  });

  it("saves the latest note again, as before, when the mark is not what the save is for", () => {
    expect(
      savesNote({ noteEmpty: false, repeatsLatest: true, markDecides: false }),
    ).toBe(true);
  });

  it("does not copy the latest note when only the mark is set", () => {
    expect(
      savesNote({ noteEmpty: false, repeatsLatest: true, markDecides: true }),
    ).toBe(false);
  });

  it("saves a changed note with the mark", () => {
    expect(
      savesNote({ noteEmpty: false, repeatsLatest: false, markDecides: true }),
    ).toBe(true);
  });
});
