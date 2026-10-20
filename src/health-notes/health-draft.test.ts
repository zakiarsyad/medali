import { describe, expect, it } from "vitest";
import {
  draftFrom,
  EMPTY_DRAFT,
  withCategory,
  withIllness,
  withIllnessNote,
} from "./health-draft";
import type { HealthNote } from "./health-ids";

const LATEST: HealthNote = {
  id: "00000000-0000-4000-8000-000000000901",
  examinedOn: "2026-10-12",
  examiner: "dr. Contoh",
  illnesses: [{ illness: "asthma", note: "sejak SMP" }],
  otherHistory: "Sinusitis",
  medicine: "Inhaler bila perlu",
  advice: "Bawa inhaler.",
  category: "attention",
  savedBy: "Penilai Contoh",
};

describe("draftFrom", () => {
  it("starts empty, following the test, for a student with no note", () => {
    expect(draftFrom(undefined)).toEqual(EMPTY_DRAFT);
    expect(EMPTY_DRAFT).toMatchObject({
      illnesses: [],
      category: null,
      categoryTouched: false,
    });
  });

  it("starts from the latest note, keeping its chosen category as set by hand", () => {
    expect(draftFrom(LATEST)).toEqual({
      examiner: "",
      illnesses: ["asthma"],
      illnessNotes: { asthma: "sejak SMP" },
      otherHistory: "Sinusitis",
      medicine: "Inhaler bila perlu",
      advice: "Bawa inhaler.",
      category: "attention",
      categoryTouched: true,
    });
  });

  it("leaves Pemeriksa empty, to be typed fresh for each note, also after a save fills the form from the note just saved", () => {
    const typed = { ...draftFrom(LATEST), examiner: "dr. Baru" };
    const saved = { ...LATEST, examiner: typed.examiner };

    expect(draftFrom(saved).examiner).toBe("");
    expect(EMPTY_DRAFT.examiner).toBe("");
  });

  it("lets the suggestion work for a latest note that follows the test", () => {
    expect(draftFrom({ ...LATEST, category: null })).toMatchObject({
      category: null,
      categoryTouched: false,
    });
  });
});

describe("withIllness", () => {
  it("suggests Perlu tindak lanjut medis for Epilepsi and Perlu perhatian for Asma", () => {
    expect(withIllness(EMPTY_DRAFT, "epilepsy", true).category).toBe("medical");
    expect(withIllness(EMPTY_DRAFT, "asthma", true).category).toBe("attention");
  });

  it("keeps the illnesses in the order Riwayat penyakit offers them", () => {
    const draft = withIllness(
      withIllness(EMPTY_DRAFT, "epilepsy", true),
      "asthma",
      true,
    );
    expect(draft.illnesses).toEqual(["asthma", "epilepsy"]);
  });

  it("goes back to following the test when the illness that suggested is dropped", () => {
    const picked = withIllness(EMPTY_DRAFT, "diabetes", true);
    const dropped = withIllness(picked, "diabetes", false);
    expect(dropped.illnesses).toEqual([]);
    expect(dropped.category).toBeNull();
  });

  it("no longer changes the category once it was set by hand", () => {
    const set = withCategory(EMPTY_DRAFT, "good");
    const picked = withIllness(set, "heart_disease", true);
    expect(picked.category).toBe("good");
  });

  it("drops the note of an illness that is dropped", () => {
    const picked = withIllnessNote(
      withIllness(EMPTY_DRAFT, "allergy", true),
      "allergy",
      "udang",
    );
    expect(withIllness(picked, "allergy", false).illnessNotes).toEqual({});
  });
});
