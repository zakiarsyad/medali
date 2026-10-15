// Sample Tahun akademik of this file: 3312 to 3312.
// Sample NIMs of this file: 9986111000 to 9986111099.
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { TASKS_SHOWN } from "./tasks-card";
import { countDormTasks, readDormTasks } from "./tasks-list";
import {
  addTestAppeal,
  addTestViolation,
  addViolationActor,
  addViolationSetting,
} from "./test-violations";
import {
  addTestLetter,
  addTestRejection,
  addTestViolations,
  issuedBy,
  periodIdOf,
} from "./test-warnings";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 20 October 3312.
const NOW = new Date("3312-10-20T03:00:00Z");

async function setUp(db: Database, managerStudentId: string | null = null) {
  const setting = await addViolationSetting(db, 3312, "Prodi Uji Tugas SP", [
    "9986111001",
    "9986111002",
    "9986111003",
    "9986111004",
    "9986111005",
  ]);
  const [ani = "", bea = "", cici = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji Tugas SP", ["bam_bphk"]);
  const manager = await addViolationActor(
    db,
    "Pengelola Uji Tugas SP",
    ["dorm_manager"],
    managerStudentId,
  );
  const periodId = await periodIdOf(db, 3312);
  return { ...setting, ani, bea, cici, bamId: bam.id, manager, periodId };
}

/** Gives a student SP 1 of the semester, issued by `byId`. */
function giveFirst(
  db: Database,
  studentId: string,
  periodId: string,
  byId: string,
) {
  return addTestLetter(db, {
    studentId,
    periodId,
    level: 1,
    ...issuedBy(byId),
  });
}

function asRole(account: AccountForAccess, roles: RoleId[]): AccountForAccess {
  return { ...account, roles };
}

describe("readDormTasks: Penetapan SP", () => {
  it("lists each resident due for an SP, SP 2 first and then by name, with NIM, room, the SP held, and the counts of the semester", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, cici, otherDorm, bamId, manager, periodId } =
        await setUp(db);
      await addTestViolations(db, ani, bamId, 7, "3312-10-01");
      await giveFirst(db, bea, periodId, manager.id);
      await addTestRejection(db, bea, bamId, "3312-10-05");
      await addTestRejection(db, bea, bamId, "3312-10-06");
      await giveFirst(db, cici, periodId, manager.id);
      await addTestRejection(db, cici, bamId, "3312-10-05");
      await addTestRejection(db, otherDorm, bamId, "3312-10-07");

      const { warnings } = await readDormTasks(db, manager, NOW);

      expect(warnings?.total).toBe(3);
      expect(warnings?.items.map((item) => [item.name, item.level])).toEqual([
        ["Bea Uji Pelanggaran", 2],
        ["Ani Uji Pelanggaran", 1],
        ["Dodi Uji Pelanggaran", 1],
      ]);
      expect(warnings?.items[0]).toMatchObject({
        studentId: bea,
        nim: "9986111002",
        mark: 1,
        counted: 0,
        rejected: 2,
      });
      expect(warnings?.items[1]).toMatchObject({
        studentId: ani,
        room: "Asrama Dana Rakca, belum diplot",
        mark: null,
        counted: 7,
        rejected: 0,
      });
    });
  });

  it("leaves out a resident whose violation is taken off by an accepted advokasi, and keeps one whose advokasi was rejected", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, bamId, manager } = await setUp(db);
      const decided = {
        decidedBy: bamId,
        decidedAt: new Date("3312-10-12T03:00:00Z"),
      };
      await addTestViolations(db, ani, bamId, 6, "3312-10-01");
      const accepted = await addTestViolation(db, ani, bamId, "3312-10-11");
      await addTestAppeal(db, accepted, { status: "accepted", ...decided });
      await addTestViolations(db, bea, bamId, 6, "3312-10-01");
      const rejected = await addTestViolation(db, bea, bamId, "3312-10-11");
      await addTestAppeal(db, rejected, {
        status: "rejected",
        decisionNote: "Tidak ada izin.",
        ...decided,
      });

      const { warnings } = await readDormTasks(db, manager, NOW);

      expect(warnings?.items.map((item) => item.studentId)).toEqual([bea]);
      expect(warnings?.total).toBe(1);
      expect(await countDormTasks(db, manager, NOW)).toBe(1);
    });
  });

  it("shows 20 of a long list, the highest SP first, and counts them all", async () => {
    await inTestDatabase(async (db) => {
      const { bea, bamId, manager, periodId } = await setUp(db);
      await giveFirst(db, bea, periodId, manager.id);
      await addTestRejection(db, bea, bamId, "3312-10-05");
      await addTestRejection(db, bea, bamId, "3312-10-06");
      const programId = await addTestProgram(db, "Prodi Uji Tugas SP Lain");
      for (let place = 10; place < 31; place++) {
        const studentId = await addTestStudent(db, programId, {
          nim: `99861110${place}`,
          name: `Penghuni Uji SP ${place}`,
          cohortYear: 3312,
        });
        await addTestRejection(db, studentId, bamId, "3312-10-08");
      }

      const { warnings } = await readDormTasks(db, manager, NOW);

      expect(TASKS_SHOWN).toBe(20);
      expect(warnings?.items).toHaveLength(TASKS_SHOWN);
      expect(warnings?.total).toBe(22);
      expect(warnings?.items[0]?.studentId).toBe(bea);
      expect(warnings?.items[1]?.name).toBe("Penghuni Uji SP 10");
    });
  });

  it("leaves out the student of the account itself, whose SP another Pengelola Asrama sets", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, bamId, manager } = await setUp(db);
      const own = { ...manager, studentId: ani };
      await addTestRejection(db, ani, bamId, "3312-10-05");
      await addTestRejection(db, bea, bamId, "3312-10-05");

      const { warnings } = await readDormTasks(db, own, NOW);

      expect(warnings?.items.map((item) => item.studentId)).toEqual([bea]);
      expect(warnings?.total).toBe(1);
      expect(await countDormTasks(db, own, NOW)).toBe(1);
    });
  });

  it.each(ROLE_IDS.filter((role) => role !== "dorm_manager"))(
    "gives %s no list and no count, as it does not issue SPs",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { ani, bamId, manager } = await setUp(db);
        await addTestRejection(db, ani, bamId, "3312-10-05");
        const other = asRole(manager, [role]);

        expect((await readDormTasks(db, other, NOW)).warnings).toBeNull();
        expect(await countDormTasks(db, other, NOW)).toBe(0);
      });
    },
  );
});

describe("readDormTasks: advokasi waiting for BAM", () => {
  it("counts the advokasi that wait for BAM, and not toward the number in the menu", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, bamId, manager } = await setUp(db);
      const first = await addTestViolation(db, ani, bamId, "3312-10-11");
      await addTestAppeal(db, first);
      const second = await addTestViolation(db, bea, bamId, "3312-10-11");
      await addTestAppeal(db, second);
      const decided = await addTestViolation(db, bea, bamId, "3312-10-12");
      await addTestAppeal(db, decided, {
        status: "accepted",
        decidedBy: bamId,
        decidedAt: new Date("3312-10-13T03:00:00Z"),
      });

      expect((await readDormTasks(db, manager, NOW)).waitingAppeals).toBe(2);
      expect(await countDormTasks(db, manager, NOW)).toBe(0);
    });
  });

  it("gives no advokasi number to an account that does not see Pelanggaran", async () => {
    await inTestDatabase(async (db) => {
      const { manager } = await setUp(db);
      const tasks = await readDormTasks(db, asRole(manager, ["mentor"]), NOW);

      expect(tasks.waitingAppeals).toBeNull();
    });
  });
});
