// Sample Tahun akademik of this file: 3400 to 3400.
import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestAttendance,
  addTestPeriods,
  addTestSchedule,
} from "@/features/activities/test-records";
import { countProofs } from "./proof-counts";
import { PROOF_KINDS } from "./proof-kinds";
import { readSentGroups } from "./sent-groups";
import { addProofSetting, addTestProofs } from "./test-proofs";

/*
 * This file's own sample values: the Tahun akademik 3400, the program
 * UJIBERKASHITUNG and the NIMs 9989500000 to 9989500099.
 */

const inTestDatabase = withTestDatabase();

/** In the odd period of 3400, which ends on 31 January 3401. */
const SENT_AT = new Date("3400-09-10T03:00:00Z");

describe("readSentGroups", () => {
  it("counts the kept files of each kind by status and day sent", async () => {
    await inTestDatabase(async (db) => {
      const { oddId } = await addTestPeriods(db, 3400);
      const setting = await addProofSetting(
        db,
        oddId,
        "UJIBERKASHITUNG",
        "9989500001",
      );
      await addTestProofs(db, setting, SENT_AT, true);
      await addTestProofs(db, setting, SENT_AT, false);

      const groups = await readSentGroups(db);

      for (const kind of PROOF_KINDS) {
        const ofKind = groups.filter((group) => group.kind === kind);
        expect(ofKind).toHaveLength(2);
        for (const found of ofKind) {
          expect(found).toMatchObject({
            sentOn: "3400-09-10",
            isMarked: false,
            files: 1,
          });
        }
      }
    });
  });

  it("leaves out a record with no file", async () => {
    await inTestDatabase(async (db) => {
      const { oddId } = await addTestPeriods(db, 3400);
      const setting = await addProofSetting(
        db,
        oddId,
        "UJIBERKASHITUNG",
        "9989500002",
      );
      const scheduleId = await addTestSchedule(db, {
        activityId: setting.activityId,
        academicPeriodId: oddId,
        changedBy: setting.deciderId,
        startsOn: "3400-09-10",
      });
      await addTestAttendance(db, setting.deciderId, {
        scheduleId,
        studentId: setting.student.studentId,
        status: "valid",
        sentAt: SENT_AT,
      });

      expect(await readSentGroups(db)).toEqual([]);
    });
  });

  it("gives counts where only the decided files of an old period may go", async () => {
    await inTestDatabase(async (db) => {
      const { oddId } = await addTestPeriods(db, 3400);
      const setting = await addProofSetting(
        db,
        oddId,
        "UJIBERKASHITUNG",
        "9989500003",
      );
      await addTestProofs(db, setting, SENT_AT, true);
      await addTestProofs(db, setting, SENT_AT, false);
      const periods = [{ startsOn: "3400-08-01", endsOn: "3401-01-31" }];

      const counts = countProofs(await readSentGroups(db), {
        keepDays: 30,
        periods,
        today: "3401-06-01",
      });

      for (const kind of PROOF_KINDS) {
        expect(counts.kept[kind]).toBe(2);
        expect(counts.removable[kind]).toBe(1);
      }
    });
  });
});
