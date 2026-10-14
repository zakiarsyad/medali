import { describe, expect, it } from "vitest";
import {
  type CandidateStudent,
  choiceOf,
  isChosen,
  type ParticipantChoice,
  shownChoiceOf,
  takesPart,
} from "./chosen-participants";

const STUDENT: CandidateStudent = {
  id: "00000000-0000-4000-8000-0000000000d1",
  className: "2-01",
  cohortYear: 2024,
  isActive: true,
};

const OTHER_ID = "00000000-0000-4000-8000-0000000000d2";

const BY_STUDENT: ParticipantChoice = {
  kind: "students",
  studentIds: [OTHER_ID, STUDENT.id],
};
const BY_CLASS: ParticipantChoice = {
  kind: "classes",
  classNames: ["2-02", "2-01"],
};
const BY_COHORT: ParticipantChoice = { kind: "cohorts", cohortYears: [2024] };
const ACROSS_COHORTS: ParticipantChoice = {
  kind: "cohorts",
  cohortYears: [2023, 2024],
};

describe("takesPart", () => {
  it.each([
    ["chosen by name", BY_STUDENT],
    ["in a chosen class", BY_CLASS],
    ["in the chosen angkatan", BY_COHORT],
    ["in one of the angkatan chosen across angkatan", ACROSS_COHORTS],
  ])("lets an Aktif student take part when %s", (_how, choice) => {
    expect(takesPart(STUDENT, choice)).toBe(true);
  });

  it.each([
    [
      "the students chosen are others",
      { kind: "students", studentIds: [OTHER_ID] },
    ],
    [
      "the classes chosen are others",
      { kind: "classes", classNames: ["2-02"] },
    ],
    [
      "the angkatan chosen are others",
      { kind: "cohorts", cohortYears: [2023, 2025] },
    ],
  ] satisfies [string, ParticipantChoice][])(
    "leaves a student out when %s",
    (_how, choice) => {
      expect(takesPart(STUDENT, choice)).toBe(false);
    },
  );

  it("leaves a student without a class out of every choice by class", () => {
    const classless = { ...STUDENT, className: null };

    expect(takesPart(classless, BY_CLASS)).toBe(false);
  });

  it("leaves out a student who is not Aktif, however they were chosen", () => {
    const inactive = { ...STUDENT, isActive: false };

    for (const choice of [BY_STUDENT, BY_CLASS, BY_COHORT, ACROSS_COHORTS]) {
      expect(takesPart(inactive, choice)).toBe(false);
    }
  });

  it("lets a student who joined a chosen class or angkatan later take part: only the class and angkatan they have now count", () => {
    const joinedLater = {
      ...STUDENT,
      id: "00000000-0000-4000-8000-0000000000d9",
    };

    expect(takesPart(joinedLater, BY_CLASS)).toBe(true);
    expect(takesPart(joinedLater, BY_COHORT)).toBe(true);
    expect(takesPart(joinedLater, BY_STUDENT)).toBe(false);
  });
});

describe("isChosen", () => {
  it("keeps a student chosen by name who is no longer Aktif among those chosen", () => {
    const inactive = { ...STUDENT, isActive: false };

    expect(isChosen(inactive, BY_STUDENT)).toBe(true);
    expect(takesPart(inactive, BY_STUDENT)).toBe(false);
  });
});

describe("shownChoiceOf", () => {
  it("keeps only how many students were chosen one by one", () => {
    expect(shownChoiceOf(BY_STUDENT)).toEqual({ kind: "students", chosen: 2 });
  });

  it("keeps the classes and the angkatan chosen as they are", () => {
    expect(shownChoiceOf(BY_CLASS)).toEqual(BY_CLASS);
    expect(shownChoiceOf(ACROSS_COHORTS)).toEqual(ACROSS_COHORTS);
  });
});

describe("choiceOf", () => {
  const nobody = { studentId: null, className: null, cohortYear: null };

  it("puts the stored rows of one kind together", () => {
    expect(
      choiceOf([
        { ...nobody, studentId: OTHER_ID },
        { ...nobody, studentId: STUDENT.id },
      ]),
    ).toEqual(BY_STUDENT);
    expect(
      choiceOf([
        { ...nobody, className: "2-02" },
        { ...nobody, className: "2-01" },
      ]),
    ).toEqual(BY_CLASS);
    expect(
      choiceOf([
        { ...nobody, cohortYear: 2023 },
        { ...nobody, cohortYear: 2024 },
      ]),
    ).toEqual(ACROSS_COHORTS);
  });

  it("refuses a schedule with no participant: one always has at least one", () => {
    expect(() => choiceOf([])).toThrow();
  });

  it("refuses rows of two kinds: a schedule is for one kind of choice", () => {
    expect(() =>
      choiceOf([
        { ...nobody, className: "2-01" },
        { ...nobody, cohortYear: 2024 },
      ]),
    ).toThrow();
  });

  it("refuses a row that names nothing", () => {
    expect(() => choiceOf([nobody])).toThrow();
  });
});
