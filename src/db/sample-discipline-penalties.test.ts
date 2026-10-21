import { describe, expect, it } from "vitest";
import {
  DECISION_NUMBER_MAX_LENGTH,
  OTHER_SOCIAL_WORK_MAX_LENGTH,
  PENALTY_DESCRIPTION_MAX_LENGTH,
  PENALTY_DESCRIPTION_MIN_LENGTH,
  PENALTY_STATUSES,
} from "@/features/guidance/penalty-ids";
import { ruleOf, statusOf } from "@/features/guidance/penalty-rules";
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

  it.each(SAMPLE_DISCIPLINE_PENALTIES)(
    "are followed up only as their Jenjang and student allow: $nim",
    (penalty) => {
      const rule = ruleOf(penalty.category, penalty.level);
      if (penalty.movedTo !== undefined) {
        expect(rule.outcome).not.toBe("dismissed");
      }
      const conditions = penalty.conditionsMet ?? [];
      if (conditions.length === 0) return;
      expect(rule.outcome).toBe("suspended");
      expect(STUDENT_OF.get(penalty.nim)?.originAgency).toBeTruthy();
      expect(new Set(conditions).size).toBe(conditions.length);
    },
  );

  it("hold every status, and a suspended student with an Instansi asal", () => {
    const statuses = SAMPLE_DISCIPLINE_PENALTIES.map(
      (penalty) =>
        penalty.movedTo ?? statusOf(ruleOf(penalty.category, penalty.level)),
    );
    expect([...new Set(statuses)].sort()).toEqual([...PENALTY_STATUSES].sort());
    const suspendedWithAgency = SAMPLE_DISCIPLINE_PENALTIES.filter(
      (penalty) =>
        ruleOf(penalty.category, penalty.level).outcome === "suspended" &&
        Boolean(STUDENT_OF.get(penalty.nim)?.originAgency),
    );
    expect(suspendedWithAgency.length).toBeGreaterThan(0);
  });

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
