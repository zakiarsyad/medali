// Sample Tahun akademik of this file: 3295 to 3295.
// Sample NIMs of this file: 9986106000 to 9986106099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { dormWarningLetters } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readOwnWarning } from "./own-warning";
import { addViolationActor, addViolationSetting } from "./test-violations";
import {
  addTestLetter,
  addTestRejection,
  addTestViolations,
  issuedBy,
  periodIdOf,
} from "./test-warnings";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 20 October 3295.
const NOW = new Date("3295-10-20T03:00:00Z");
const ISSUED_AT = new Date("3295-10-10T09:30:00Z");

async function setUp(db: Database) {
  const setting = await addViolationSetting(db, 3295, "Prodi Uji SP Sendiri", [
    "9986106001",
    "9986106002",
    "9986106003",
    "9986106004",
    "9986106005",
  ]);
  const [ani = "", bea = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji SP Sendiri", ["bam_bphk"]);
  const manager = await addViolationActor(db, "Pengelola Uji SP Sendiri", [
    "dorm_manager",
  ]);
  const aniAccount = await addViolationActor(db, "Ani", ["student"], ani);
  const periodId = await periodIdOf(db, 3295);
  return { ani, bea, bam, manager, aniAccount, periodId };
}

describe("readOwnWarning", () => {
  it("gives the resident their count, the SP they are called for with the cause and the schedule, and their issued SP with its result", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bam, manager, aniAccount, periodId } = await setUp(db);
      await addTestLetter(db, {
        studentId: ani,
        periodId,
        level: 1,
        ...issuedBy(manager.id, ISSUED_AT),
      });
      await addTestViolations(db, ani, bam.id, 12, "3295-09-01");
      await addTestRejection(db, ani, bam.id, "3295-10-05");
      await addTestLetter(db, {
        studentId: ani,
        periodId,
        level: 2,
        callDay: "3295-10-21",
        callTime: "16:00",
        callPlace: "Kantor Pengelola Asrama",
      });

      const own = await readOwnWarning(db, aniAccount, NOW);

      expect(own).toMatchObject({
        standing: { counted: 12, rejected: 1, hasFirst: true, level: 2 },
        causes: ["12 pelanggaran tercatat"],
        schedule: {
          day: "3295-10-21",
          time: "16:00",
          place: "Kantor Pengelola Asrama",
        },
        letters: [
          {
            level: 1,
            issuedAt: ISSUED_AT,
            result: "Mahasiswa hadir dan mengakui pelanggarannya.",
          },
        ],
      });
      expect(own?.rejected).toHaveLength(1);
      expect(own?.semesterTitle).toContain("3295");
    });
  });

  it("tells the resident whether the proposal of their SP 2 is Diajukan or Diproses, without the notes", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager, aniAccount, periodId } = await setUp(db);
      await addTestLetter(db, {
        studentId: ani,
        periodId,
        level: 1,
        ...issuedBy(manager.id, ISSUED_AT),
      });
      const second = await addTestLetter(db, {
        studentId: ani,
        periodId,
        level: 2,
        ...issuedBy(manager.id, ISSUED_AT),
        proposalNote: "Pelanggaran berulang setelah SP 1.",
      });

      const before = await readOwnWarning(db, aniAccount, NOW);
      expect(before?.letters.map((letter) => letter.proposal)).toEqual([
        null,
        "proposed",
      ]);

      await db
        .update(dormWarningLetters)
        .set({
          handlingNote: "Diteruskan ke Pembinaan.",
          handledBy: manager.id,
          handledAt: NOW,
        })
        .where(eq(dormWarningLetters.id, second));
      const after = await readOwnWarning(db, aniAccount, NOW);
      expect(after?.letters.map((letter) => letter.proposal)).toEqual([
        null,
        "handled",
      ]);
      expect(JSON.stringify(after)).not.toContain("Diteruskan ke Pembinaan.");
      expect(JSON.stringify(after)).not.toContain("Pelanggaran berulang");
    });
  });

  it("gives a resident with nothing counted a standing of nothing", async () => {
    await inTestDatabase(async (db) => {
      const { aniAccount } = await setUp(db);

      expect(await readOwnWarning(db, aniAccount, NOW)).toMatchObject({
        standing: { counted: 0, rejected: 0, hasFirst: false, level: null },
        causes: [],
        schedule: null,
        letters: [],
        rejected: [],
      });
    });
  });

  it("reads only the account's own student, and refuses an account without the right or without a student", async () => {
    await inTestDatabase(async (db) => {
      const { bea, bam, manager, periodId, aniAccount } = await setUp(db);
      await addTestLetter(db, {
        studentId: bea,
        periodId,
        level: 1,
        ...issuedBy(manager.id),
      });

      const own = await readOwnWarning(db, aniAccount, NOW);
      expect(own?.letters).toEqual([]);
      expect(await readOwnWarning(db, manager, NOW)).toBeNull();
      expect(await readOwnWarning(db, bam, NOW)).toBeNull();
      const beaAsStaff = await addViolationActor(
        db,
        "Bea sebagai BAM",
        ["bam_bphk"],
        bea,
      );
      expect(await readOwnWarning(db, beaAsStaff, NOW)).toBeNull();
    });
  });
});
