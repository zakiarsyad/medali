// Sample NIMs of this file: 9962000800 to 9962000899. None is added to
// the database.
import { describe, expect, it } from "vitest";
import type { ScoredMember } from "./group-scores";
import type { StoredMark } from "./meetings-overview";
import { scoreRowsOf } from "./score-rows";

const GROUP_ID = "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7500";
const ANI: ScoredMember = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7501",
  name: "Ani Uji Baris",
  nim: "9962000801",
  score: 88,
  scoredAt: new Date("2026-10-08T09:00:00+07:00"),
  opensDetail: true,
};
const BUDI: ScoredMember = {
  id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f7502",
  name: "Budi Uji Baris",
  nim: "9962000802",
  score: null,
  scoredAt: null,
  opensDetail: false,
};

function markOf(
  meeting: number,
  studentId: string,
  mark: StoredMark["mark"],
): StoredMark {
  return { meetingId: `meeting-${meeting}`, studentId, mark };
}

const MARKS: StoredMark[] = [
  markOf(1, ANI.id, "present"),
  markOf(2, ANI.id, "present"),
  markOf(3, ANI.id, "sick"),
  markOf(4, ANI.id, "absent"),
  markOf(1, "someone-who-left", "absent"),
];

describe("scoreRowsOf", () => {
  it("shows how many of the meetings that count each member came to", () => {
    const [ani, budi] = scoreRowsOf(GROUP_ID, [ANI, BUDI], MARKS);

    expect(ani?.attendance).toBe("2/3");
    expect(budi?.attendance).toBe("-");
  });

  it("keeps the saved score and the day it was saved, in campus time", () => {
    const [ani, budi] = scoreRowsOf(GROUP_ID, [ANI, BUDI], MARKS);

    expect(ani).toMatchObject({ score: 88, scoredOn: "8 Okt 2026" });
    expect(budi).toMatchObject({ score: null, scoredOn: null });
  });

  it("gives a link to the detail only for a member whose detail may be opened", () => {
    const [ani, budi] = scoreRowsOf(GROUP_ID, [ANI, BUDI], MARKS);

    expect(ani?.detailAddress).toBe(
      `/pengasuhan/nilai?kelompok=${GROUP_ID}&profil=${ANI.id}`,
    );
    expect(budi?.detailAddress).toBeNull();
  });
});
