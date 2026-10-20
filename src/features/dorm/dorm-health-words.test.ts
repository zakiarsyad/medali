import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import {
  reachHint,
  savedDormHealthMessage,
  withoutNoteHint,
} from "./dorm-health-words";

describe("withoutNoteHint", () => {
  it("says how many lack a note, <5 among them, or that every one has one", () => {
    expect(withoutNoteHint(0)).toBe("catatan lengkap");
    expect(withoutNoteHint("<5")).toBe("<5 belum punya catatan");
    expect(withoutNoteHint(12)).toBe("12 belum punya catatan");
  });
});

const SOME: RowLimit = {
  kind: "some",
  studyProgramIds: [],
  menteesOf: [],
  studentIds: [],
};

describe("reachHint", () => {
  it("names the dorms for who sees every resident", () => {
    expect(reachHint({ kind: "all" })).toBe(
      "Wismantara, Dana Rakca, Cipta Bakti",
    );
  });

  it("names the own mentees of Pengasuh and the own program of Ketua Program Studi", () => {
    expect(reachHint({ ...SOME, menteesOf: ["pengasuh"] })).toBe(
      "anak asuh Anda",
    );
    expect(reachHint({ ...SOME, studyProgramIds: [7] })).toBe("prodi Anda");
    expect(
      reachHint({ ...SOME, menteesOf: ["pengasuh"], studyProgramIds: [7] }),
    ).toBe("anak asuh dan prodi Anda");
  });
});

describe("savedDormHealthMessage", () => {
  it("names the mark alone when no note was kept", () => {
    expect(
      savedDormHealthMessage({ name: "Ani", category: null, markSaved: true }),
    ).toBe("Penanda potensi kesehatan mental Ani disimpan.");
  });

  it("names the note and its category, and the mark when it was kept too", () => {
    const note = { name: "Ani", category: "attention" } as const;
    expect(savedDormHealthMessage({ ...note, markSaved: false })).toBe(
      "Catatan kesehatan Ani disimpan. Kategori: perlu perhatian.",
    );
    expect(savedDormHealthMessage({ ...note, markSaved: true })).toBe(
      "Catatan kesehatan Ani disimpan. Kategori: perlu perhatian. Penanda potensi kesehatan mental juga disimpan.",
    );
  });
});
