import { describe, expect, it } from "vitest";
import {
  approvedWords,
  entryNoteOf,
  NOTE_NEEDED,
  NOTE_TOO_LONG,
  POINTS_OUTSIDE,
  parseDecision,
  UNKNOWN_DECISION,
} from "./request-decision";

describe("parseDecision", () => {
  it("takes an approval with whole points from 1 to 30, with or without a note", () => {
    expect(parseDecision("approve", "2", "")).toEqual({
      ok: true,
      value: { kind: "approve", points: 2, note: "" },
    });
    expect(parseDecision("approve", " 30 ", " Sesuai. ")).toEqual({
      ok: true,
      value: { kind: "approve", points: 30, note: "Sesuai." },
    });
    expect(parseDecision("approve", "1", "").ok).toBe(true);
  });

  it.each([
    ["0", "0"],
    ["31", "31"],
    ["a fraction", "2.5"],
    ["a negative number", "-3"],
    ["nothing", ""],
    ["a word", "dua"],
    ["no text", 7],
  ])("refuses an approval with %s as points", (_what, points) => {
    expect(parseDecision("approve", points, "")).toEqual({
      ok: false,
      error: POINTS_OUTSIDE,
    });
  });

  it("says the points are wrong with the words of the prototype", () => {
    expect(POINTS_OUTSIDE).toBe("Poin harus 1–30.");
  });

  it("takes a rejection with its note, whatever the points say", () => {
    expect(parseDecision("reject", "99", " Sudah tercatat. ")).toEqual({
      ok: true,
      value: { kind: "reject", note: "Sudah tercatat." },
    });
  });

  it.each([
    ["no note", ""],
    ["only spaces", "   "],
    ["a note that is no text", 12],
  ])("refuses a rejection with %s", (_what, note) => {
    expect(parseDecision("reject", "2", note)).toEqual({
      ok: false,
      error: NOTE_NEEDED,
    });
  });

  it("takes a note of 500 characters and refuses one longer, either way", () => {
    expect(parseDecision("reject", "", "a".repeat(500)).ok).toBe(true);
    expect(parseDecision("reject", "", "a".repeat(501))).toEqual({
      ok: false,
      error: NOTE_TOO_LONG,
    });
    expect(parseDecision("approve", "2", "a".repeat(501))).toEqual({
      ok: false,
      error: NOTE_TOO_LONG,
    });
  });

  it("refuses a decision it does not know", () => {
    expect(parseDecision("cancel", "2", "x")).toEqual({
      ok: false,
      error: UNKNOWN_DECISION,
    });
  });
});

describe("approvedWords", () => {
  it("names the points and the student", () => {
    expect(approvedWords(3, "Ayu Lestiani")).toBe(
      "Disetujui: +3 SIKU untuk Ayu Lestiani.",
    );
  });
});

describe("entryNoteOf", () => {
  it("keeps a report of up to 500 characters as it is", () => {
    expect(entryNoteOf("a".repeat(500))).toBe("a".repeat(500));
  });

  it("cuts a longer report to 500 characters, ending in an ellipsis", () => {
    const note = entryNoteOf("a".repeat(1000));

    expect(note).toHaveLength(500);
    expect(note.endsWith("a…")).toBe(true);
  });
});
