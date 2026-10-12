import { describe, expect, it } from "vitest";
import { type FixFacts, whatStopsFix } from "./fix-check";

const GROUPS = [
  {
    studyProgramId: 1,
    entryPath: "regular" as const,
    number: 1,
    mentorId: "ani",
    studentIds: ["s1", "s2"],
  },
  {
    studyProgramId: 1,
    entryPath: "regular" as const,
    number: 2,
    mentorId: "budi",
    studentIds: ["s3"],
  },
];

function facts(more: Partial<FixFacts> = {}): FixFacts {
  return {
    groups: GROUPS,
    waitingIds: ["s1", "s2", "s3", "s4"],
    offeredMentorIds: ["ani", "budi", "candra"],
    liveNumbers: [],
    ...more,
  };
}

describe("whatStopsFix", () => {
  it("stops nothing while every member waits, every mentor may be chosen and every number is free", () => {
    expect(whatStopsFix(facts())).toBe(null);
  });

  it("stops for members who do not wait for a group any more, and counts them", () => {
    const stopped = whatStopsFix(facts({ waitingIds: ["s2"] }));

    expect(stopped).toContain("2 mahasiswa pada draf");
  });

  it("stops for a chosen mentor who may not be chosen any more", () => {
    const stopped = whatStopsFix(facts({ offeredMentorIds: ["ani"] }));

    expect(stopped).toContain("1 pengasuh pada draf");
  });

  it("stops for a number that a group in force of the same program studi and jalur holds", () => {
    const taken = { studyProgramId: 1, entryPath: "regular" as const };
    const stopped = whatStopsFix(
      facts({ liveNumbers: [{ ...taken, number: 2 }] }),
    );

    expect(stopped).toContain("1 kelompok pada draf");
  });

  it("lets the same number stand in another program studi or jalur", () => {
    const liveNumbers = [
      { studyProgramId: 2, entryPath: "regular" as const, number: 1 },
      { studyProgramId: 1, entryPath: "transfer" as const, number: 2 },
    ];

    expect(whatStopsFix(facts({ liveNumbers }))).toBe(null);
  });

  it("names the members first: forming the groups again also clears the rest", () => {
    const stopped = whatStopsFix(
      facts({ waitingIds: [], offeredMentorIds: [] }),
    );

    expect(stopped).toContain("3 mahasiswa pada draf");
    expect(stopped).not.toContain("pengasuh pada draf");
  });
});
