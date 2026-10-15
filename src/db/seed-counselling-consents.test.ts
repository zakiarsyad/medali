// Sample Tahun akademik of this file: those of the app's sample data.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { isStudentStep, SAMPLE_CONSENTS } from "./sample-counselling-consents";
import {
  accounts,
  counsellingConsentChanges,
  counsellingConsents,
  students,
} from "./schema";
import { fillWithSampleData } from "./seed";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

// Loading the whole sample set takes seconds when every check runs at
// once, so everything is checked on one load.
describe("the sample consents to counselling", { timeout: 20_000 }, () => {
  it("are added in their last status, each with a log line per change, made before now", async () => {
    await inTestDatabase(async (db) => {
      await fillWithSampleData(db);
      const now = new Date();

      const consents = await db
        .select({
          id: counsellingConsents.id,
          nim: students.nim,
          status: counsellingConsents.status,
          way: counsellingConsents.way,
          changedAt: counsellingConsents.changedAt,
        })
        .from(counsellingConsents)
        .innerJoin(students, eq(students.id, counsellingConsents.studentId));
      const lines = await db
        .select({
          consentId: counsellingConsentChanges.consentId,
          statusBefore: counsellingConsentChanges.statusBefore,
          statusAfter: counsellingConsentChanges.statusAfter,
          by: accounts.studentId,
        })
        .from(counsellingConsentChanges)
        .innerJoin(
          accounts,
          eq(accounts.id, counsellingConsentChanges.changedBy),
        )
        .orderBy(asc(counsellingConsentChanges.changedAt));

      expect(consents).toHaveLength(SAMPLE_CONSENTS.length);
      for (const sample of SAMPLE_CONSENTS) {
        const consent = consents.find((each) => each.nim === sample.nim);
        const last = sample.steps.at(-1);
        expect(consent).toMatchObject({ status: last?.status, way: last?.way });
        expect(consent?.changedAt.getTime()).toBeLessThanOrEqual(now.getTime());
        const own = lines.filter((line) => line.consentId === consent?.id);
        expect(own.map((line) => line.statusAfter)).toEqual(
          sample.steps.map((step) => step.status),
        );
        expect(own[0]?.statusBefore).toBeNull();
        expect(own.map((line) => line.by !== null)).toEqual(
          sample.steps.map(isStudentStep),
        );
      }
    });
  });
});
