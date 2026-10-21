// Sample Tahun akademik of this file: those of the app's sample data.
import { and, eq, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { visibleTo } from "@/auth/visible-students";
import { ruleOf, statusOf } from "@/features/guidance/penalty-rules";
import { samplePeriods } from "./sample-data";
import { SAMPLE_DISCIPLINE_PENALTIES } from "./sample-discipline-penalties";
import {
  accounts,
  disciplinePenalties,
  disciplinePenaltyChanges,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample discipline penalties", { timeout: 20_000 }, () => {
  it("are kept in the semester each names, by today at the latest, each with its log line, some seen by the sample Pengasuh", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const today = campusDay();
      const periods = samplePeriods(today);
      const penalties = await db.select().from(disciplinePenalties);
      const lines = await db.select().from(disciplinePenaltyChanges);
      const nims = new Map(
        (await db.select().from(students)).map((s) => [s.id, s.nim]),
      );

      expect(penalties).toHaveLength(SAMPLE_DISCIPLINE_PENALTIES.length);
      for (const sample of SAMPLE_DISCIPLINE_PENALTIES) {
        const kept = penalties.find(
          (penalty) =>
            nims.get(penalty.studentId) === sample.nim &&
            penalty.description === sample.description,
        );
        const day = kept?.day ?? "";
        expect(day <= today).toBe(true);
        expect(runningPeriodOn(periods, day)).toBe(periods[sample.semester]);
        const own = lines.filter((line) => line.penaltyId === kept?.id);
        expect(own).toContainEqual(
          expect.objectContaining({
            action: "added",
            changedBy: kept?.savedBy,
          }),
        );
        expect(kept?.status).toBe(
          sample.movedTo ?? statusOf(ruleOf(sample.category, sample.level)),
        );
        expect(kept?.conditionsMet).toEqual(sample.conditionsMet ?? []);
        expect(kept?.decision).toBe("pending");
        expect(kept?.version).toBe(own.length);
        if (sample.movedTo !== undefined) {
          expect(own).toContainEqual(
            expect.objectContaining({
              action: "status_changed",
              statusBefore: "imposed",
              statusAfter: sample.movedTo,
            }),
          );
        }
        if (sample.conditionsMet !== undefined) {
          expect(own).toContainEqual(
            expect.objectContaining({
              action: "conditions_changed",
              conditionsBefore: [],
              conditionsAfter: sample.conditionsMet,
            }),
          );
        }
      }

      // The sample Pengasuh by name: another account with the role, such
      // as one a check left behind, may come first in an unordered read.
      const [mentorAccount] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(
          and(eq(accounts.name, "Hendra Wijaya"), isNull(accounts.studentId)),
        );
      const mentor = mentorAccount?.id ?? "";
      const mentees = await db
        .select({ nim: students.nim })
        .from(students)
        .where(
          visibleTo({
            kind: "some",
            studyProgramIds: [],
            menteesOf: [mentor],
            studentIds: [],
          }),
        );
      const menteeNims = mentees.map((mentee) => mentee.nim);
      const seen = SAMPLE_DISCIPLINE_PENALTIES.filter((penalty) =>
        menteeNims.includes(penalty.nim),
      );
      expect(seen.length).toBeGreaterThan(0);
    });
  });
});
