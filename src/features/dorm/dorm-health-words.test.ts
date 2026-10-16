import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import { reachHint } from "./dorm-health-words";

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
