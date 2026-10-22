import { describe, expect, it } from "vitest";
import {
  absentCount,
  chosenActivity,
  hasStarted,
  marksFor,
  type Participant,
  sameMarks,
  shownParticipants,
  withOwnMarkKept,
} from "./count-view";
import { TEST_ROW } from "./test-activities";

const DAY = "2026-10-14";
const MORNING = {
  ...TEST_ROW,
  id: "pagi",
  startTime: "05:30",
  endTime: "06:15",
};
const NOON = { ...TEST_ROW, id: "siang", startTime: "12:00", endTime: "13:00" };
const EVENING = {
  ...TEST_ROW,
  id: "malam",
  startTime: "19:00",
  endTime: "21:00",
};
const DAY_ACTIVITIES = [MORNING, NOON, EVENING];

function at(time: string) {
  return { day: DAY, time };
}

const ANI: Participant = {
  id: "ani",
  name: "Ani Wiratama",
  nim: "9937750001",
  dorm: "dana_rakca",
  room: "101",
};
const BUDI: Participant = {
  id: "budi",
  name: "Budi Hasibuan",
  nim: "9937750002",
  dorm: "cipta_bakti",
  room: null,
};
const CICI: Participant = {
  id: "cici",
  name: "Cici Manurung",
  nim: "9937750003",
  dorm: "dana_rakca",
  room: "102",
};

describe("hasStarted", () => {
  it("is false before the first minute of the day's activity, and on a later day", () => {
    expect(hasStarted({ ...MORNING, day: DAY }, at("05:29"))).toBe(false);
    expect(hasStarted({ ...MORNING, day: "2026-10-15" }, at("23:00"))).toBe(
      false,
    );
  });

  it("is true from its first minute on, after its end, and on an earlier day", () => {
    expect(hasStarted({ ...MORNING, day: DAY }, at("05:30"))).toBe(true);
    expect(hasStarted({ ...MORNING, day: DAY }, at("07:00"))).toBe(true);
    expect(hasStarted({ ...EVENING, day: "2026-10-13" }, at("00:00"))).toBe(
      true,
    );
  });
});

describe("chosenActivity", () => {
  it("takes the one the address asks for when the day has it", () => {
    expect(chosenActivity(DAY_ACTIVITIES, "siang", DAY, at("06:00"))).toBe(
      NOON,
    );
  });

  it("takes the latest that has started when the address asks for none", () => {
    expect(chosenActivity(DAY_ACTIVITIES, null, DAY, at("12:30"))).toBe(NOON);
    expect(chosenActivity(DAY_ACTIVITIES, null, DAY, at("22:00"))).toBe(
      EVENING,
    );
  });

  it("takes the latest that has started when the address asks for one the day does not have", () => {
    expect(chosenActivity(DAY_ACTIVITIES, "lain", DAY, at("12:30"))).toBe(NOON);
  });

  it("takes the first when none has started", () => {
    expect(chosenActivity(DAY_ACTIVITIES, null, DAY, at("04:00"))).toBe(
      MORNING,
    );
    expect(
      chosenActivity(DAY_ACTIVITIES, null, "2026-10-20", at("12:00")),
    ).toBe(MORNING);
  });

  it("takes the last of a day gone by", () => {
    expect(
      chosenActivity(DAY_ACTIVITIES, null, "2026-10-13", at("04:00")),
    ).toBe(EVENING);
  });

  it("is null for a day without activities", () => {
    expect(chosenActivity([], null, DAY, at("12:00"))).toBeNull();
  });
});

describe("marksFor", () => {
  it("gives each participant the kept mark, and Hadir without a note to one the count does not hold", () => {
    const kept = { ani: { isAbsent: true, note: "Sakit" } };

    expect(marksFor([ANI, BUDI], kept)).toEqual({
      ani: { isAbsent: true, note: "Sakit" },
      budi: { isAbsent: false, note: "" },
    });
  });

  it("leaves out a kept mark of one who no longer takes part", () => {
    const kept = { pindah: { isAbsent: true, note: "" } };

    expect(marksFor([ANI], kept)).toEqual({
      ani: { isAbsent: false, note: "" },
    });
  });
});

describe("sameMarks", () => {
  const marks = {
    ani: { isAbsent: true, note: "Sakit" },
    budi: { isAbsent: false, note: "" },
  };

  it("is true for the same mark of each participant, whatever spaces a note holds around it", () => {
    expect(
      sameMarks(marks, {
        budi: { isAbsent: false, note: "  " },
        ani: { isAbsent: true, note: " Sakit " },
      }),
    ).toBe(true);
  });

  it("is false when a tick, a note or a participant differs", () => {
    expect(
      sameMarks(marks, { ...marks, budi: { isAbsent: true, note: "" } }),
    ).toBe(false);
    expect(
      sameMarks(marks, { ...marks, ani: { isAbsent: true, note: "Izin" } }),
    ).toBe(false);
    expect(sameMarks(marks, { ani: marks.ani })).toBe(false);
    expect(
      sameMarks(marks, { ani: marks.ani, cici: { isAbsent: false, note: "" } }),
    ).toBe(false);
  });
});

describe("withOwnMarkKept", () => {
  const OWN = "00000000-0000-4000-8000-0000000000a1";
  const OTHER = "00000000-0000-4000-8000-0000000000b2";
  const ABSENT = { isAbsent: true, note: "Sakit" };
  const PRESENT = { isAbsent: false, note: "" };

  it("keeps every mark sent for an account that is not a student", () => {
    const sent = { [OWN]: ABSENT, [OTHER]: ABSENT };

    expect(withOwnMarkKept(sent, {}, null)).toEqual({
      marks: sent,
      ownChangeLeftOut: false,
    });
  });

  it("keeps the own mark as kept, and the others as sent, when the own mark is sent unchanged", () => {
    const kept = { [OWN]: ABSENT, [OTHER]: PRESENT };

    expect(
      withOwnMarkKept({ [OWN]: ABSENT, [OTHER]: ABSENT }, kept, OWN),
    ).toEqual({
      marks: { [OWN]: ABSENT, [OTHER]: ABSENT },
      ownChangeLeftOut: false,
    });
    expect(withOwnMarkKept({ [OTHER]: ABSENT }, {}, OWN)).toEqual({
      marks: { [OTHER]: ABSENT },
      ownChangeLeftOut: false,
    });
  });

  it("leaves out a change of the own mark, also with its key in capitals, and says so", () => {
    for (const key of [OWN, OWN.toUpperCase()]) {
      expect(
        withOwnMarkKept({ [key]: ABSENT, [OTHER]: ABSENT }, {}, OWN),
      ).toEqual({ marks: { [OTHER]: ABSENT }, ownChangeLeftOut: true });
    }
    expect(withOwnMarkKept({}, { [OWN]: ABSENT }, OWN)).toEqual({
      marks: { [OWN]: ABSENT },
      ownChangeLeftOut: true,
    });
    expect(
      withOwnMarkKept(
        { [OWN]: { isAbsent: true, note: "Lain" } },
        { [OWN]: ABSENT },
        OWN,
      ),
    ).toEqual({ marks: { [OWN]: ABSENT }, ownChangeLeftOut: true });
  });
});

describe("absentCount", () => {
  it("counts those marked Tidak hadir only", () => {
    expect(
      absentCount({
        ani: { isAbsent: true, note: "" },
        budi: { isAbsent: false, note: "Terlambat" },
        cici: { isAbsent: true, note: "Sakit" },
      }),
    ).toBe(2);
  });
});

describe("shownParticipants", () => {
  const all = [ANI, BUDI, CICI];
  const marks = {
    ani: { isAbsent: false, note: "" },
    budi: { isAbsent: false, note: "Terlambat" },
    cici: { isAbsent: true, note: "" },
  };

  it("shows everyone without a search or the filter", () => {
    expect(shownParticipants(all, marks, "", false)).toEqual(all);
  });

  it("finds by part of the name in any case, or by part of the NIM", () => {
    expect(shownParticipants(all, marks, "  hASIB ", false)).toEqual([BUDI]);
    expect(shownParticipants(all, marks, "0003", false)).toEqual([CICI]);
  });

  it("shows only those absent or with a note under Hanya tidak hadir atau bercatatan", () => {
    expect(shownParticipants(all, marks, "", true)).toEqual([BUDI, CICI]);
    expect(shownParticipants(all, marks, "cici", true)).toEqual([CICI]);
  });
});
