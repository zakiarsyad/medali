import { describe, expect, it } from "vitest";
import {
  type HeldActivity,
  historyOf,
  marksOver,
  type OwnMark,
  pastOccurrences,
  type TimedMark,
  tallyOf,
} from "./history";
import { TEST_ONE_OFF, TEST_ROW } from "./test-activities";

// 14 October 2026 is a Wednesday.
const TODAY = "2026-10-14";
const EVENING = {
  ...TEST_ROW,
  id: "malam",
  name: "Apel malam uji",
  startTime: "22:00",
  endTime: "22:30",
};

function keysOf(held: { day: string; activity: { id: string } }[]): string[] {
  return held.map(({ day, activity }) => `${day} ${activity.id}`);
}

describe("pastOccurrences", () => {
  it("takes today's activities that are over, then the days before, the latest first", () => {
    const held = pastOccurrences(
      [TEST_ROW, EVENING],
      { day: TODAY, time: "12:00" },
      4,
    );

    expect(keysOf(held)).toEqual([
      `${TODAY} ${TEST_ROW.id}`,
      `2026-10-13 malam`,
      `2026-10-13 ${TEST_ROW.id}`,
      `2026-10-12 malam`,
    ]);
  });

  it("goes no further back than a year, and no further than the first day of an activity", () => {
    const held = pastOccurrences(
      [TEST_ONE_OFF],
      { day: "2026-10-20", time: "08:00" },
      25,
    );
    const old = pastOccurrences(
      [TEST_ONE_OFF],
      { day: "2027-12-01", time: "08:00" },
      25,
    );

    expect(keysOf(held)).toEqual([`2026-10-14 ${TEST_ONE_OFF.id}`]);
    expect(old).toEqual([]);
  });
});

const MORNING: HeldActivity = {
  activityId: "a",
  day: "2026-10-14",
  name: "Apel pagi",
  startTime: "05:30",
};
const HELD: HeldActivity[] = [
  MORNING,
  {
    activityId: "b",
    day: "2026-10-13",
    name: "Belajar malam",
    startTime: "19:30",
  },
  {
    activityId: "c",
    day: "2026-10-13",
    name: "Kerja bakti",
    startTime: "07:00",
  },
];

describe("marksOver", () => {
  const apel: TimedMark = {
    activityId: "a",
    day: TODAY,
    name: "Apel pagi",
    startTime: "05:30",
    endTime: "06:30",
    isAbsent: true,
    note: "",
  };

  it("leaves out an announced activity of today that still runs, and keeps it once it is over", () => {
    expect(marksOver([apel], { day: TODAY, time: "05:50" })).toEqual([]);
    expect(marksOver([apel], { day: TODAY, time: "06:30" })).toEqual([]);
    const { endTime: _endTime, ...kept } = apel;
    expect(marksOver([apel], { day: TODAY, time: "06:31" })).toEqual([kept]);
  });

  it("keeps a mark of a day gone by", () => {
    const yesterday = { ...apel, day: "2026-10-13" };

    expect(marksOver([yesterday], { day: TODAY, time: "00:00" })).toHaveLength(
      1,
    );
  });
});

describe("tallyOf", () => {
  it("counts Hadir and Tidak hadir", () => {
    const mark: OwnMark = { ...MORNING, isAbsent: false, note: "" };

    expect(
      tallyOf([mark, { ...mark, isAbsent: true }, { ...mark, day: "x" }]),
    ).toEqual({ present: 2, absent: 1 });
  });
});

describe("historyOf", () => {
  it("gives the resident's own mark of an announced activity, Belum diumumkan for one not announced, and leaves out one announced without them", () => {
    const marks: OwnMark[] = [{ ...MORNING, isAbsent: true, note: "Sakit" }];
    const announced = new Set(["2026-10-14 a", "2026-10-13 c"]);

    expect(historyOf(HELD, marks, announced, 25)).toEqual([
      { ...MORNING, status: "absent", note: "Sakit" },
      { ...HELD[1], status: "not_announced", note: "" },
    ]);
  });

  it("keeps an announced mark whose activity no longer shows that day, such as one removed later", () => {
    const removed: HeldActivity = {
      activityId: "z",
      day: "2026-10-14",
      name: "Malam keakraban",
      startTime: "19:00",
    };
    const mark: OwnMark = { ...removed, isAbsent: false, note: "" };

    expect(historyOf([], [mark], new Set(), 25)).toEqual([
      { ...removed, status: "present", note: "" },
    ]);
  });

  it("orders the latest first and keeps the last ones only", () => {
    const history = historyOf(HELD, [], new Set(), 2);

    expect(history.map((entry) => entry.activityId)).toEqual(["a", "b"]);
  });
});
