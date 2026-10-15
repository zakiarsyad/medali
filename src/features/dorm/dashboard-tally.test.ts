import { describe, expect, it } from "vitest";
import type { AcceptedAs } from "./clarification-ids";
import {
  type Changed,
  changeOf,
  changesOf,
  type MarkGroup,
  markKey,
  type ParticipantMark,
  participantsOf,
  tallyWhere,
} from "./dashboard-tally";
import type { ApprovedLeave } from "./leave-marks";

const GROUPS: MarkGroup[] = [
  { countId: "a", dorm: "dana_rakca", isAbsent: false, students: 8 },
  { countId: "a", dorm: "dana_rakca", isAbsent: true, students: 2 },
  { countId: "a", dorm: "cipta_bakti", isAbsent: false, students: 5 },
  { countId: "b", dorm: "dana_rakca", isAbsent: false, students: 3 },
  { countId: "b", dorm: null, isAbsent: true, students: 1 },
];

describe("changeOf", () => {
  it("makes Izin pesiar and Izin khusus Izin, and ITMK Hadir", () => {
    expect(changeOf("leave", null)).toBe("leave");
    expect(changeOf("itmk", null)).toBe("present");
  });

  it("makes an accepted clarification Hadir or Izin where no leave covers the activity", () => {
    expect(changeOf(null, "present")).toBe("present");
    expect(changeOf(null, "leave")).toBe("leave");
  });

  it("leaves it to the leave when both cover the activity, as Kegiatan asrama does", () => {
    expect(changeOf("leave", "present")).toBe("leave");
    expect(changeOf("itmk", "leave")).toBe("present");
  });

  it("changes nothing without leave or an accepted clarification", () => {
    expect(changeOf(null, null)).toBeNull();
  });
});

describe("tallyWhere", () => {
  it("adds up Hadir and Tidak hadir of the groups it keeps", () => {
    expect(tallyWhere(GROUPS, [], (row) => row.countId === "a")).toEqual({
      present: 13,
      absent: 2,
      leave: 0,
    });
    expect(tallyWhere(GROUPS, [], (row) => row.dorm === "dana_rakca")).toEqual({
      present: 11,
      absent: 2,
      leave: 0,
    });
  });

  it("moves a participant on leave out of Hadir or Tidak hadir into Izin, and one on ITMK or clarified as present into Hadir", () => {
    const changed: Changed[] = [
      { countId: "a", dorm: "dana_rakca", isAbsent: true, becomes: "leave" },
      { countId: "a", dorm: "dana_rakca", isAbsent: false, becomes: "leave" },
      { countId: "a", dorm: "dana_rakca", isAbsent: true, becomes: "present" },
    ];

    expect(tallyWhere(GROUPS, changed, (row) => row.countId === "a")).toEqual({
      present: 13,
      absent: 0,
      leave: 2,
    });
  });

  it("leaves out the changes of groups it does not keep", () => {
    const changed: Changed[] = [
      { countId: "b", dorm: "dana_rakca", isAbsent: false, becomes: "leave" },
    ];

    expect(tallyWhere(GROUPS, changed, (row) => row.countId === "a")).toEqual({
      present: 13,
      absent: 2,
      leave: 0,
    });
  });

  it("gives nothing when no group is kept", () => {
    expect(tallyWhere(GROUPS, [], () => false)).toEqual({
      present: 0,
      absent: 0,
      leave: 0,
    });
  });
});

describe("changesOf", () => {
  const HELD = new Map([
    ["a", { day: "2026-10-14", startTime: "05:30", endTime: "06:15" }],
    ["b", { day: "2026-10-14", startTime: "19:00", endTime: "20:00" }],
  ]);
  const OUTING: ApprovedLeave = {
    studentId: "ani",
    kind: "outing",
    start: new Date("2026-10-14T05:00:00+07:00"),
    end: new Date("2026-10-14T07:00:00+07:00"),
  };
  const MARKS: ParticipantMark[] = [
    { countId: "a", studentId: "ani", dorm: "dana_rakca", isAbsent: true },
    { countId: "b", studentId: "ani", dorm: "dana_rakca", isAbsent: true },
    { countId: "b", studentId: "budi", dorm: null, isAbsent: true },
  ];

  it("changes the mark of a participant whose leave covers the activity, and only there", () => {
    expect(changesOf(MARKS, HELD, [OUTING], new Map())).toEqual([
      { countId: "a", dorm: "dana_rakca", isAbsent: true, becomes: "leave" },
    ]);
  });

  it("changes the mark of a participant with an accepted clarification where no leave covers it", () => {
    const accepted = new Map<string, AcceptedAs>([
      [markKey("a", "ani"), "present"],
      [markKey("b", "budi"), "present"],
    ]);

    expect(changesOf(MARKS, HELD, [OUTING], accepted)).toEqual([
      { countId: "a", dorm: "dana_rakca", isAbsent: true, becomes: "leave" },
      { countId: "b", dorm: null, isAbsent: true, becomes: "present" },
    ]);
  });

  it("changes nothing of a count whose time is not known", () => {
    const marks: ParticipantMark[] = [
      { countId: "c", studentId: "ani", dorm: "dana_rakca", isAbsent: true },
    ];

    expect(changesOf(marks, HELD, [OUTING], new Map())).toEqual([]);
  });
});

describe("participantsOf", () => {
  it("counts everyone in the count: Hadir, Tidak hadir and Izin", () => {
    expect(participantsOf({ present: 7, absent: 2, leave: 1 })).toBe(10);
  });
});
