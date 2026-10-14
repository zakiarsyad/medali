import { describe, expect, it } from "vitest";
import {
  CLASS_LIST_MAX,
  chosenCount,
  classesOffered,
  cohortsOffered,
  draftOf,
  matchingClasses,
  type ParticipantDraft,
  type ParticipantPool,
  type PickedStudent,
  STARTING_DRAFT,
  sentValues,
  withClassToggled,
  withCohortToggled,
  withMode,
  withoutStudent,
  withStudent,
} from "./participant-draft";

const AKTIF: PickedStudent = {
  id: "00000000-0000-4000-8000-0000000000f1",
  name: "Uji Draf Aktif",
  nim: "9974630001",
  isActive: true,
};

const NON_AKTIF: PickedStudent = {
  id: "00000000-0000-4000-8000-0000000000f2",
  name: "Uji Draf Non Aktif",
  nim: "9974630002",
  isActive: false,
};

const POOL: ParticipantPool = {
  classes: [
    { className: "2-01", students: 30 },
    { className: "2-02", students: 28 },
    { className: "3-01", students: 25 },
  ],
  cohorts: [
    { cohortYear: 2023, students: 300 },
    { cohortYear: 2024, students: 320 },
  ],
};

function draft(more: Partial<ParticipantDraft>): ParticipantDraft {
  return { ...STARTING_DRAFT, ...more };
}

describe("chosenCount", () => {
  it("counts the Aktif students picked one by one, not the others", () => {
    const picked = draft({ mode: "students", students: [AKTIF, NON_AKTIF] });

    expect(chosenCount(picked, POOL)).toBe(1);
  });

  it("adds the Aktif students of the ticked classes", () => {
    const ticked = draft({ mode: "classes", classNames: ["2-01", "3-01"] });

    expect(chosenCount(ticked, POOL)).toBe(55);
  });

  it("adds the Aktif students of the angkatan picked", () => {
    expect(chosenCount(draft({ cohortYears: [2024] }), POOL)).toBe(320);
    const across = draft({ mode: "cohorts", cohortYears: [2023, 2024] });
    expect(chosenCount(across, POOL)).toBe(620);
  });

  it("counts only the kind shown", () => {
    const mixed = draft({
      mode: "classes",
      classNames: [],
      cohortYears: [2024],
      students: [AKTIF],
    });

    expect(chosenCount(mixed, POOL)).toBe(0);
  });

  it("counts nobody for a class with no Aktif student now", () => {
    expect(
      chosenCount(draft({ mode: "classes", classNames: ["9-99"] }), POOL),
    ).toBe(0);
  });
});

describe("picks", () => {
  it("adds a student once, and takes them out with ×", () => {
    const once = withStudent(draft({ mode: "students" }), AKTIF);
    const twice = withStudent(once, AKTIF);

    expect(twice.students).toEqual([AKTIF]);
    expect(withoutStudent(twice, AKTIF.id).students).toEqual([]);
  });

  it("ticks and unticks a class", () => {
    const ticked = withClassToggled(draft({ mode: "classes" }), "2-01");

    expect(ticked.classNames).toEqual(["2-01"]);
    expect(withClassToggled(ticked, "2-01").classNames).toEqual([]);
  });

  it("keeps one angkatan on Per angkatan, the last pressed", () => {
    const first = withCohortToggled(draft({ mode: "cohort" }), 2023);

    expect(withCohortToggled(first, 2024).cohortYears).toEqual([2024]);
  });

  it("ticks and unticks angkatan on Lintas angkatan", () => {
    const across = draft({ mode: "cohorts" });
    const both = withCohortToggled(withCohortToggled(across, 2023), 2024);

    expect(both.cohortYears).toEqual([2023, 2024]);
    expect(withCohortToggled(both, 2023).cohortYears).toEqual([2024]);
  });

  it("keeps the first angkatan when going from Lintas angkatan to Per angkatan", () => {
    const across = draft({ mode: "cohorts", cohortYears: [2023, 2024] });

    expect(withMode(across, "cohort").cohortYears).toEqual([2023]);
    expect(withMode(across, "classes").cohortYears).toEqual([2023, 2024]);
  });
});

describe("sentValues", () => {
  it("sends the picks of the kind shown only", () => {
    const mixed = draft({
      mode: "students",
      students: [AKTIF, NON_AKTIF],
      classNames: ["2-01"],
      cohortYears: [2024],
    });

    expect(sentValues(mixed)).toEqual([AKTIF.id, NON_AKTIF.id]);
    expect(sentValues(withMode(mixed, "classes"))).toEqual(["2-01"]);
    expect(sentValues(withMode(mixed, "cohort"))).toEqual(["2024"]);
  });
});

describe("draftOf", () => {
  it("opens a schedule on the kind of choice it holds", () => {
    expect(
      draftOf({ kind: "students", chosen: 2 }, [AKTIF, NON_AKTIF]),
    ).toEqual(draft({ mode: "students", students: [AKTIF, NON_AKTIF] }));
    expect(draftOf({ kind: "classes", classNames: ["2-01"] }, [])).toEqual(
      draft({ mode: "classes", classNames: ["2-01"] }),
    );
    expect(draftOf({ kind: "cohorts", cohortYears: [2024] }, [])).toEqual(
      draft({ mode: "cohort", cohortYears: [2024] }),
    );
    expect(draftOf({ kind: "cohorts", cohortYears: [2023, 2024] }, [])).toEqual(
      draft({ mode: "cohorts", cohortYears: [2023, 2024] }),
    );
  });
});

describe("the classes offered", () => {
  it("adds a ticked class that has no Aktif student now, in name order", () => {
    expect(classesOffered(POOL.classes, ["2-03"])).toEqual([
      { className: "2-01", students: 30 },
      { className: "2-02", students: 28 },
      { className: "2-03", students: 0 },
      { className: "3-01", students: 25 },
    ]);
  });

  it("shows the classes whose name holds what was typed", () => {
    expect(
      matchingClasses(POOL.classes, " 2-0").map((row) => row.className),
    ).toEqual(["2-01", "2-02"]);
    expect(matchingClasses(POOL.classes, "")).toHaveLength(3);
  });

  it("shows the first 120 matches only", () => {
    const many = Array.from({ length: 130 }, (_, place) => ({
      className: `K-${String(place).padStart(3, "0")}`,
      students: 1,
    }));

    const shown = matchingClasses(many, "k-");

    expect(shown).toHaveLength(CLASS_LIST_MAX);
    expect(shown[0]?.className).toBe("K-000");
  });
});

describe("cohortsOffered", () => {
  it("lists the newest first, with a picked angkatan that has nobody now", () => {
    expect(cohortsOffered(POOL.cohorts, [2020])).toEqual([
      { cohortYear: 2024, students: 320 },
      { cohortYear: 2023, students: 300 },
      { cohortYear: 2020, students: 0 },
    ]);
  });
});
