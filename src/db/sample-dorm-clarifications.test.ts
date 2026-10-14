import { describe, expect, it } from "vitest";
import { daysAfter } from "@/academic-periods/days-after";
import { DORM_IDS } from "@/dorms/dorms";
import { sampleDormActivities } from "./sample-dorm-activities";
import { sampleDormClarifications } from "./sample-dorm-clarifications";
import {
  afterEnd,
  type KeptSampleActivity,
  type KeptSampleCount,
  type SampleResident,
  sampleDormCounts,
} from "./sample-dorm-counts";
import { SAMPLE_LEAVE_RESIDENTS } from "./sample-dorm-leaves";

const DAY = "2026-10-14";
// 10:00 on campus on that day.
const NOW = new Date("2026-10-14T03:00:00Z");
const activities: KeptSampleActivity[] = sampleDormActivities(DAY).map(
  (sample, place) => ({ id: `kegiatan-${place}`, sample }),
);
/** Twelve residents in each dorm, in the order of their names. */
const residents: SampleResident[] = DORM_IDS.flatMap((dorm) =>
  Array.from({ length: 12 }, (_, place) => ({ id: `${dorm}-${place}`, dorm })),
);
const counts: KeptSampleCount[] = sampleDormCounts(
  DAY,
  activities,
  residents,
).map((count, place) => ({ id: `hitung-${place}`, count }));
const clarifications = sampleDormClarifications(counts, residents, NOW);

function countOf(countId: string): KeptSampleCount {
  const found = counts.find((kept) => kept.id === countId);
  if (!found) throw new Error(`No count ${countId}.`);
  return found;
}

describe("sampleDormClarifications", () => {
  it("has one in every status, accepted as Hadir and as Izin, and rejected by BAM and by Pengelola Asrama", () => {
    const kinds = clarifications.map(
      (each) =>
        `${each.status} ${each.acceptedAs ?? ""} ${each.decided?.by ?? ""}`,
    );

    expect(kinds).toEqual(
      expect.arrayContaining([
        "submitted  ",
        "verified  ",
        "accepted present manager",
        "accepted leave manager",
        "rejected  ",
        "rejected  manager",
        "closed  bam",
      ]),
    );
  });

  it("is of an absence that BAM announced, or for a closed one of an absence BAM withdrew", () => {
    for (const each of clarifications) {
      const { count } = countOf(each.countId);
      const now = count.marks[each.studentId];
      const first = count.firstMarks?.[each.studentId];

      expect(count.stage).not.toBe("draft");
      if (each.status === "closed") {
        expect(first?.isAbsent).toBe(true);
        expect(now?.isAbsent).toBe(false);
      } else {
        expect(now?.isAbsent).toBe(true);
      }
    }
  });

  it("leaves out the residents who have sample leave, and leaves an absence to clarify", () => {
    const withLeave = new Set(
      residents.slice(0, SAMPLE_LEAVE_RESIDENTS).map((resident) => resident.id),
    );
    const asked = new Set(
      clarifications.map((each) => `${each.countId} ${each.studentId}`),
    );
    const open = counts.flatMap(({ id, count }) =>
      Object.entries(count.marks)
        .filter(
          ([studentId, mark]) => mark.isAbsent && !withLeave.has(studentId),
        )
        .map(([studentId]) => `${id} ${studentId}`),
    );

    for (const each of clarifications) {
      // A closed one is of an absence withdrawn since: leave plays no part.
      if (each.status === "closed") continue;
      expect(withLeave.has(each.studentId)).toBe(false);
    }
    expect(asked.size).toBe(clarifications.length);
    expect(open.some((key) => !asked.has(key))).toBe(true);
  });

  it("is sent within the seven days after the activity, then checked, then decided, and none after now", () => {
    for (const each of clarifications) {
      const { count } = countOf(each.countId);
      const sent = each.sentAt.getTime();

      expect(sent).toBeGreaterThan(afterEnd(count).getTime());
      expect(sent).toBeLessThanOrEqual(NOW.getTime());
      expect(daysAfter(count.day, 7) >= DAY).toBe(true);
      if (each.verified) {
        expect(each.verified.at.getTime()).toBeGreaterThanOrEqual(sent);
        expect(each.verified.at.getTime()).toBeLessThanOrEqual(NOW.getTime());
      }
      if (each.decided) {
        const checked = each.verified?.at.getTime() ?? sent;
        expect(each.decided.at.getTime()).toBeGreaterThanOrEqual(checked);
        expect(each.decided.at.getTime()).toBeLessThanOrEqual(NOW.getTime());
      }
    }
  });

  it("gives a rejection its note, and every reason and explanation in plain words", () => {
    for (const each of clarifications) {
      expect(each.explanation.length).toBeGreaterThanOrEqual(10);
      if (each.status !== "rejected") continue;
      const note = each.decided ? each.decided.note : each.verified?.note;
      expect(note).not.toBe("");
    }
  });
});
