import { describe, expect, it } from "vitest";
import { parseAssessment, type SentAssessment } from "./assessment-input";
import {
  INVALID_SCORES,
  NO_STUDENT,
  NOTE_TOO_LONG,
  UNKNOWN_SOURCE,
} from "./assessment-messages";

const STUDENT = "00000000-0000-4000-8000-000000000501";

const SENT: SentAssessment = {
  studentId: STUDENT,
  scores: { M: "80", E: "78", D: "84", A: "72", L: "82", I: "86" },
  source: "medali_instrument",
  note: "  Kenaikan pada Disiplin.  ",
};

describe("parseAssessment", () => {
  it("takes six whole scores, a source of the list and a trimmed note", () => {
    expect(parseAssessment(SENT)).toEqual({
      ok: true,
      value: {
        studentId: STUDENT,
        scores: { M: 80, E: 78, D: 84, A: 72, L: 82, I: 86 },
        source: "medali_instrument",
        note: "Kenaikan pada Disiplin.",
      },
    });
  });

  it("takes 40 and 100, the ends of the range", () => {
    const scores = { ...SENT.scores, M: "40", I: "100" };
    expect(parseAssessment({ ...SENT, scores }).ok).toBe(true);
  });

  it.each(["39", "101", "0", "80.5", "80,5", "", "abc", "080", "-50", "1e2"])(
    "refuses a score of %j",
    (score) => {
      const scores = { ...SENT.scores, D: score };
      expect(parseAssessment({ ...SENT, scores })).toEqual(INVALID_SCORES);
    },
  );

  it("refuses a source outside the list", () => {
    expect(parseAssessment({ ...SENT, source: "Rapat lain" })).toEqual(
      UNKNOWN_SOURCE,
    );
  });

  it("refuses a note longer than 500 characters, and takes one of 500", () => {
    expect(parseAssessment({ ...SENT, note: "a".repeat(501) })).toEqual(
      NOTE_TOO_LONG,
    );
    expect(parseAssessment({ ...SENT, note: "a".repeat(500) }).ok).toBe(true);
  });

  it("refuses a form with no student picked", () => {
    expect(parseAssessment({ ...SENT, studentId: "" })).toEqual(NO_STUDENT);
    expect(parseAssessment({ ...SENT, studentId: "bukan-kunci" })).toEqual(
      NO_STUDENT,
    );
  });
});
