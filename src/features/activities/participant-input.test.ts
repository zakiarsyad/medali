import { describe, expect, it } from "vitest";
import {
  NO_PARTICIPANTS,
  ONE_COHORT,
  PARTICIPANT_RULES_MAX,
  parseParticipants,
  TOO_FEW_COHORTS,
  TOO_MANY_PARTICIPANTS,
  UNKNOWN_PARTICIPANTS,
} from "./participant-input";

const ONE_ID = "00000000-0000-4000-8000-0000000000e1";
const OTHER_ID = "00000000-0000-4000-8000-0000000000e2";

describe("parseParticipants", () => {
  it.each(["students", "classes", "cohort", "cohorts"])(
    "refuses %s with nothing picked",
    (mode) => {
      expect(parseParticipants({ mode, values: [] })).toEqual(NO_PARTICIPANTS);
      expect(parseParticipants({ mode, values: [" ", ""] })).toEqual(
        NO_PARTICIPANTS,
      );
    },
  );

  it("refuses a kind of choice the form does not offer", () => {
    expect(parseParticipants({ mode: "groups", values: ["2-01"] })).toEqual(
      NO_PARTICIPANTS,
    );
  });

  it("takes the students picked one by one, each once", () => {
    expect(
      parseParticipants({
        mode: "students",
        values: [ONE_ID, OTHER_ID, ONE_ID],
      }),
    ).toEqual({
      ok: true,
      value: { kind: "students", studentIds: [ONE_ID, OTHER_ID] },
    });
  });

  it("refuses a student that is not a key", () => {
    expect(
      parseParticipants({ mode: "students", values: [ONE_ID, "budi"] }),
    ).toEqual(UNKNOWN_PARTICIPANTS);
  });

  it("takes the classes ticked, trimmed, by name", () => {
    expect(
      parseParticipants({ mode: "classes", values: ["2-02", " 2-01"] }),
    ).toEqual({
      ok: true,
      value: { kind: "classes", classNames: ["2-01", "2-02"] },
    });
  });

  it("refuses a class name longer than any class has", () => {
    expect(
      parseParticipants({ mode: "classes", values: ["K".repeat(51)] }),
    ).toEqual(UNKNOWN_PARTICIPANTS);
  });

  it("takes one angkatan for Per angkatan, and refuses two", () => {
    expect(parseParticipants({ mode: "cohort", values: ["2024"] })).toEqual({
      ok: true,
      value: { kind: "cohorts", cohortYears: [2024] },
    });
    expect(
      parseParticipants({ mode: "cohort", values: ["2023", "2024"] }),
    ).toEqual(ONE_COHORT);
  });

  it("takes two angkatan or more for Lintas angkatan, the earliest first, and refuses one", () => {
    expect(
      parseParticipants({ mode: "cohorts", values: ["2024", "2023"] }),
    ).toEqual({
      ok: true,
      value: { kind: "cohorts", cohortYears: [2023, 2024] },
    });
    expect(parseParticipants({ mode: "cohorts", values: ["2024"] })).toEqual(
      TOO_FEW_COHORTS,
    );
    expect(
      parseParticipants({ mode: "cohorts", values: ["2024", "2024"] }),
    ).toEqual(TOO_FEW_COHORTS);
  });

  it("refuses an angkatan that is not a year", () => {
    expect(
      parseParticipants({ mode: "cohorts", values: ["2023", "24"] }),
    ).toEqual(UNKNOWN_PARTICIPANTS);
  });

  it("refuses more picks than one schedule holds", () => {
    const values = Array.from(
      { length: PARTICIPANT_RULES_MAX + 1 },
      (_, place) => `K-${place}`,
    );

    expect(parseParticipants({ mode: "classes", values })).toEqual(
      TOO_MANY_PARTICIPANTS,
    );
  });
});
