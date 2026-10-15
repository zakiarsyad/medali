// Sample Tahun akademik of this file: 3293 to 3293.
// Sample NIMs of this file: 9986103000 to 9986103099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestClarification } from "./test-clarifications";
import { EVERYONE } from "./test-records";
import { addViolationActor, addViolationSetting } from "./test-violations";
import { addTestRejection, addTestViolations } from "./test-warnings";
import { readWarningProcess } from "./warning-process";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 20 October 3293.
const NOW = new Date("3293-10-20T03:00:00Z");

async function setUp(db: Database) {
  const setting = await addViolationSetting(db, 3293, "Prodi Uji Proses SP", [
    "9986103001",
    "9986103002",
    "9986103003",
    "9986103004",
    "9986103005",
  ]);
  const [ani = "", bea = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji Proses", ["bam_bphk"]);
  return { ani, bea, bamId: bam.id };
}

describe("readWarningProcess", () => {
  it("gives the call with the counted violations and the rejected clarifications that still count, by BAM or by Pengelola Asrama", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bamId } = await setUp(db);
      await addTestViolations(db, ani, bamId, 3, "3293-10-01");
      await addTestRejection(db, ani, bamId, "3293-10-05");
      await addTestRejection(db, ani, bamId, "3293-10-06", {
        decidedBy: bamId,
        decidedAt: new Date("3293-10-08T03:00:00Z"),
        decisionNote: "Tidak ada bukti.",
      });
      const again = await addTestRejection(db, ani, bamId, "3293-10-07");
      await addTestClarification(db, bamId, {
        countId: again.countId,
        studentId: ani,
        status: "accepted",
        sentAt: new Date("3293-10-15T03:00:00Z"),
      });

      const process = await readWarningProcess(db, EVERYONE, ani, NOW);

      expect(process?.call).toMatchObject({ level: 1, counted: 3 });
      expect(process?.counted.map((row) => row.day)).toEqual([
        "3293-10-03",
        "3293-10-02",
        "3293-10-01",
      ]);
      expect(
        process?.rejected.map((row) => [row.day, row.rejectedBy, row.note]),
      ).toEqual([
        ["5 Okt 3293", "BAM", "Ditolak uji"],
        ["6 Okt 3293", "Pengelola Asrama", "Tidak ada bukti."],
      ]);
      expect(process?.rejected[0]).toMatchObject({
        activity: "Apel pagi uji",
        reason: "Sakit",
      });
    });
  });

  it("is null for a resident not called, or one the account does not see", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, bamId } = await setUp(db);
      await addTestViolations(db, ani, bamId, 7, "3293-10-01");
      await addTestViolations(db, bea, bamId, 6, "3293-10-01");

      expect(await readWarningProcess(db, EVERYONE, bea, NOW)).toBeNull();
      expect(
        await readWarningProcess(db, eq(students.id, bea), ani, NOW),
      ).toBeNull();
      expect(await readWarningProcess(db, EVERYONE, ani, NOW)).not.toBeNull();
    });
  });
});
