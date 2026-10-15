// Sample Tahun akademik of this file: 3296 to 3296.
// Sample NIMs of this file: 9986107000 to 9986107099.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readRejectedPanel, seesRejectedPanel } from "./rejected-panel";
import { addTestClarification } from "./test-clarifications";
import { addViolationActor, addViolationSetting } from "./test-violations";
import {
  addTestLetter,
  addTestRejection,
  issuedBy,
  periodIdOf,
} from "./test-warnings";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 20 October 3296.
const NOW = new Date("3296-10-20T03:00:00Z");

async function setUp(db: Database) {
  const setting = await addViolationSetting(db, 3296, "Prodi Uji Panel SP", [
    "9986107001",
    "9986107002",
    "9986107003",
    "9986107004",
    "9986107005",
  ]);
  const [ani = "", bea = "", cici = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji Panel", ["bam_bphk"]);
  const manager = await addViolationActor(db, "Pengelola Uji Panel", [
    "dorm_manager",
  ]);
  const periodId = await periodIdOf(db, 3296);
  return { ani, bea, cici, bam, manager, periodId };
}

describe("seesRejectedPanel", () => {
  it("is for Pengelola Asrama, Kepala Unit, BAM - BPHK and BAM - KI, not for Direktur or Ketua Program Studi", () => {
    const sees: RoleId[] = [
      "dorm_manager",
      "head_of_unit",
      "bam_bphk",
      "bam_compliance",
    ];
    for (const role of sees) expect(seesRejectedPanel([role])).toBe(true);
    const not: RoleId[] = ["director", "head_of_program", "student", "mentor"];
    for (const role of not) expect(seesRejectedPanel([role])).toBe(false);
  });
});

describe("readRejectedPanel", () => {
  it("lists the residents with a rejected clarification that still counts, the most first, with the last one and their SP status", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, cici, bam, manager, periodId } = await setUp(db);
      await addTestRejection(db, ani, bam.id, "3296-10-05");
      await addTestLetter(db, {
        studentId: bea,
        periodId,
        level: 1,
        ...issuedBy(manager.id),
      });
      await addTestRejection(db, bea, bam.id, "3296-10-06");
      await addTestRejection(db, bea, bam.id, "3296-10-08");
      const accepted = await addTestRejection(db, cici, bam.id, "3296-10-07");
      await addTestClarification(db, bam.id, {
        countId: accepted.countId,
        studentId: cici,
        status: "accepted",
        sentAt: new Date("3296-10-15T03:00:00Z"),
      });

      const panel = await readRejectedPanel(db, manager, NOW, 1);

      expect(panel?.matching).toBe(2);
      expect(
        panel?.rows.map((row) => [row.name, row.rejected, row.lastDay]),
      ).toEqual([
        ["Bea Uji Pelanggaran", 2, "8 Okt 3296"],
        ["Ani Uji Pelanggaran", 1, "5 Okt 3296"],
      ]);
      expect(panel?.rows[0]).toMatchObject({
        level: 2,
        mark: 1,
        causes: ["klarifikasi kehadiran ditolak lagi (2 kali)"],
        lastActivity: "Apel pagi uji",
      });
      expect(panel?.rows[1]).toMatchObject({
        level: 1,
        mark: null,
        causes: ["klarifikasi kehadiran ditolak"],
      });
    });
  });

  it("refuses Direktur and Ketua Program Studi, also when they ask by hand", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bam } = await setUp(db);
      await addTestRejection(db, ani, bam.id, "3296-10-05");
      for (const role of ["director", "head_of_program"] as const) {
        const actor = await addViolationActor(db, `Uji ${role}`, [role]);
        expect(await readRejectedPanel(db, actor, NOW, 1)).toBeNull();
        expect(await readRejectedPanel(db, actor, NOW, 2)).toBeNull();
      }
      for (const role of ["head_of_unit", "bam_compliance"] as const) {
        const actor = await addViolationActor(db, `Uji ${role}`, [role]);
        expect((await readRejectedPanel(db, actor, NOW, 1))?.matching).toBe(1);
      }
    });
  });
});
