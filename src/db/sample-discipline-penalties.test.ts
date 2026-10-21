import { describe, expect, it } from "vitest";
import {
  DECISION_NUMBER_MAX_LENGTH,
  OTHER_SOCIAL_WORK_MAX_LENGTH,
  PENALTY_DESCRIPTION_MAX_LENGTH,
  PENALTY_DESCRIPTION_MIN_LENGTH,
} from "@/features/guidance/penalty-ids";
import { ruleOf } from "@/features/guidance/penalty-rules";
import { SAMPLE_STUDENTS } from "./sample-data";
import { SAMPLE_DISCIPLINE_PENALTIES } from "./sample-discipline-penalties";

const STUDENT_OF = new Map(
  SAMPLE_STUDENTS.map((student) => [student.nim, student]),
);

describe("the sample discipline penalties", () => {
  it.each(SAMPLE_DISCIPLINE_PENALTIES)(
    "are of a sample student, with texts within their lengths and kerja sosial as their Jenjang asks: $nim",
    (penalty) => {
      expect(STUDENT_OF.has(penalty.nim)).toBe(true);
      expect(penalty.description.length).toBeGreaterThanOrEqual(
        PENALTY_DESCRIPTION_MIN_LENGTH,
      );
      expect(penalty.description.length).toBeLessThanOrEqual(
        PENALTY_DESCRIPTION_MAX_LENGTH,
      );
      expect(penalty.decisionNumber.length).toBeLessThanOrEqual(
        DECISION_NUMBER_MAX_LENGTH,
      );
      const rule = ruleOf(penalty.category, penalty.level);
      expect(penalty.socialWork === null).toBe(rule.socialWork === null);
      const work = penalty.socialWork;
      if (work === null) return;
      expect(work.forms.length).toBeGreaterThan(0);
      expect(work.forms.includes("other")).toBe(work.other !== "");
      expect(work.other.length).toBeLessThanOrEqual(
        OTHER_SOCIAL_WORK_MAX_LENGTH,
      );
      expect(work.startsAfter).toBeGreaterThanOrEqual(0);
      if (work.place === "home_agency") {
        expect(STUDENT_OF.get(penalty.nim)?.originAgency).toBeTruthy();
      }
    },
  );

  it("hold every Kategori, one that ends the status, and kerja sosial at an Instansi asal", () => {
    const categories = new Set(
      SAMPLE_DISCIPLINE_PENALTIES.map((penalty) => penalty.category),
    );
    expect([...categories].sort()).toEqual(["heavy", "light", "medium"]);
    const outcomes = SAMPLE_DISCIPLINE_PENALTIES.map(
      (penalty) => ruleOf(penalty.category, penalty.level).outcome,
    );
    expect(outcomes).toContain("dismissed");
    expect(outcomes).toContain("suspended");
    const places = SAMPLE_DISCIPLINE_PENALTIES.map(
      (penalty) => penalty.socialWork?.place,
    );
    expect(places).toContain("home_agency");
  });

  it("hold penalties of D3 Pajak, the program of the sample Ketua Program Studi, and of other programs", () => {
    const programs = SAMPLE_DISCIPLINE_PENALTIES.map(
      (penalty) => STUDENT_OF.get(penalty.nim)?.studyProgram,
    );
    expect(programs).toContain("D3 Pajak");
    expect(programs.some((program) => program !== "D3 Pajak")).toBe(true);
  });

  it("are saved by Pembina Disiplin Mahasiswa and Kepala Unit, who record them", () => {
    const writers = new Set(
      SAMPLE_DISCIPLINE_PENALTIES.map((penalty) => penalty.savedAs),
    );
    expect([...writers].sort()).toEqual(["discipline_officer", "head_of_unit"]);
  });
});
