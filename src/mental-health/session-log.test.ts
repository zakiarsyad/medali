import { describe, expect, it } from "vitest";
import type { SessionContent } from "./session-ids";
import { changeLine, writeLine } from "./session-log";

const WRITTEN: SessionContent = {
  day: "2026-10-19",
  kind: "individual_in_person",
  topic: "academic",
  notes: "Catatan berisi kata Zorbatul.",
  followUp: "monitoring",
  nextDay: "2026-10-26",
};

const PARTS = {
  day: "2026-10-19",
  kind: "individual_in_person",
  topic: "academic",
  followUp: "monitoring",
  nextDay: "2026-10-26",
};

describe("the log line of a counselling session", () => {
  it("of a writing holds every part but the notes, and says they were written", () => {
    expect(writeLine(WRITTEN)).toEqual({
      before: null,
      after: { ...PARTS, notes: "written" },
    });
  });

  it("of a change holds every part but the notes before and after, and says the notes changed", () => {
    const changed: SessionContent = {
      ...WRITTEN,
      kind: "group",
      notes: "Kata Quembrilo.",
    };

    expect(changeLine(WRITTEN, changed)).toEqual({
      before: PARTS,
      after: { ...PARTS, kind: "group", notes: "changed" },
    });
  });

  it("of a change says when the notes did not change", () => {
    const changed: SessionContent = { ...WRITTEN, followUp: "closed" };

    expect(changeLine(WRITTEN, changed).after).toEqual({
      ...PARTS,
      followUp: "closed",
      notes: "unchanged",
    });
  });

  it("holds no word of the notes", () => {
    const changed: SessionContent = { ...WRITTEN, notes: "Kata Quembrilo." };
    const lines = JSON.stringify([
      writeLine(WRITTEN),
      changeLine(WRITTEN, changed),
    ]);

    expect(lines).not.toContain("Zorbatul");
    expect(lines).not.toContain("Quembrilo");
  });
});
