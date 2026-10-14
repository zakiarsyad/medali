// Sample Tahun akademik of this file: 2240 to 2240.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { activityAttendanceChanges, activityAttendances } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestActivity,
  addTestActor,
  addTestAttendance,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
} from "./test-records";
import { validateTicked } from "./validate-ticked";

/*
 * This file's own sample values: the Tahun akademik 2240, the program
 * UJIVALIDASIBANYAK and the NIMs 9973000000 to 9973000099.
 */

const inTestDatabase = withTestDatabase();

const AT = new Date("2240-09-10T06:00:00Z");
const UNKNOWN = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

interface Records {
  staff: AccountForAccess;
  /** The photos of three students that wait, the first student's first. */
  waiting: string[];
}

function accountOf(id: string, roles: RoleId[]): AccountForAccess {
  return { id, roles, studyProgramId: null, studentId: null };
}

async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Banyak", ["upk_staff"]);
  const activityId = await addTestActivity(db, staff.id);
  const periods = await addTestPeriods(db, 2240);
  const programId = await addTestProgram(db, "UJIVALIDASIBANYAK");
  const scheduleId = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: staff.id,
    startsOn: "2240-09-10",
  });
  const waiting: string[] = [];
  for (const number of [1, 2, 3]) {
    const student = await addTestStudentAccount(db, programId, {
      nim: `997300000${number}`,
      name: `Mahasiswa Uji Banyak ${number}`,
      cohortYear: 2239,
    });
    const attendanceId = await addTestAttendance(db, staff.id, {
      scheduleId,
      studentId: student.studentId,
      status: "waiting",
    });
    waiting.push(attendanceId);
  }
  return { staff: accountOf(staff.id, staff.roles), waiting };
}

function statuses(db: Database) {
  return db
    .select({
      id: activityAttendances.id,
      status: activityAttendances.status,
      decidedBy: activityAttendances.decidedBy,
    })
    .from(activityAttendances);
}

async function statusOf(db: Database, id: string) {
  const [attendance] = await db
    .select({ status: activityAttendances.status })
    .from(activityAttendances)
    .where(eq(activityAttendances.id, id));
  return attendance?.status;
}

function logLines(db: Database) {
  return db
    .select()
    .from(activityAttendanceChanges)
    .orderBy(asc(activityAttendanceChanges.attendanceId));
}

describe("validateTicked", () => {
  it("validates only the photos sent, says how many, and writes a line into the log for each", async () => {
    await inTestDatabase(async (db) => {
      const { staff, waiting } = await addRecords(db);
      const [first, second, third] = waiting;
      if (!first || !second || !third) throw new Error("No photos.");

      const answer = await validateTicked(db, staff, [first, third], AT, true);

      expect(answer.state).toEqual({
        error: null,
        done: "2 presensi divalidasi.",
      });
      expect(answer.cards.map((card) => card.id).sort()).toEqual(
        [first, third].sort(),
      );
      for (const card of answer.cards) {
        expect(card).toMatchObject({
          status: "valid",
          decidedBy: "Pegawai Uji Banyak",
        });
      }
      expect(await statusOf(db, second)).toBe("waiting");
      const lines = await logLines(db);
      expect(lines.map((line) => line.attendanceId).sort()).toEqual(
        [first, third].sort(),
      );
      for (const line of lines) {
        expect(line).toMatchObject({
          changedBy: staff.id,
          changedAt: AT,
          statusBefore: "waiting",
          statusAfter: "valid",
        });
      }
    });
  });

  it("does not validate a photo that no longer waits: a rejected one stays rejected, and the message counts it apart", async () => {
    await inTestDatabase(async (db) => {
      const { staff, waiting } = await addRecords(db);
      const [first, second] = waiting;
      if (!first || !second) throw new Error("No photos.");
      const other = await addTestActor(db, "Pegawai Uji Lebih Dulu Banyak", [
        "upk_staff",
      ]);
      await db
        .update(activityAttendances)
        .set({
          status: "rejected",
          note: "Wajah tidak terlihat jelas",
          decidedAt: AT,
          decidedBy: other.id,
        })
        .where(eq(activityAttendances.id, first));

      const answer = await validateTicked(db, staff, [first, second], AT, true);

      expect(answer.state).toEqual({
        error: null,
        done: "1 presensi divalidasi. 1 sudah diputuskan sebelumnya.",
      });
      expect(await statusOf(db, first)).toBe("rejected");
      expect(answer.cards.find((card) => card.id === first)).toMatchObject({
        status: "rejected",
        note: "Wajah tidak terlihat jelas",
        decidedBy: "Pegawai Uji Lebih Dulu Banyak",
      });
      expect(await statusOf(db, second)).toBe("valid");
      const lines = await logLines(db);
      expect(lines.map((line) => line.attendanceId)).toEqual([second]);
    });
  });

  it.each([
    ["Kepala Unit", "head_of_unit"],
    ["Penilai Mahasiswa", "assessor"],
    ["Ketua Program Studi", "head_of_program"],
    ["Pengasuh", "mentor"],
    ["Mahasiswa", "student"],
  ] as const)(
    "refuses %s, who has no right to verify, and changes nothing",
    async (_who, role) => {
      await inTestDatabase(async (db) => {
        const { staff, waiting } = await addRecords(db);
        const other = accountOf(staff.id, [role]);

        const answer = await validateTicked(db, other, waiting, AT, true);

        expect(answer).toEqual({
          state: {
            error: "Anda tidak berhak memverifikasi presensi.",
            done: null,
          },
          cards: [],
        });
        const kept = await statuses(db);
        expect(kept.map((each) => each.status)).toEqual([
          "waiting",
          "waiting",
          "waiting",
        ]);
        expect(await logLines(db)).toEqual([]);
      });
    },
  );

  it("refuses more than 24 keys, and validates none of them", async () => {
    await inTestDatabase(async (db) => {
      const { staff, waiting } = await addRecords(db);
      const many = Array.from(
        { length: 22 },
        (_, index) => `0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c${String(index + 10)}`,
      );

      const answer = await validateTicked(
        db,
        staff,
        [...waiting, ...many],
        AT,
        true,
      );

      expect(answer.state).toEqual({
        error: "Paling banyak 24 presensi dapat divalidasi sekaligus.",
        done: null,
      });
      expect(await logLines(db)).toEqual([]);
    });
  });

  it("validates nothing for what is no list of keys, and passes over a key of no card", async () => {
    await inTestDatabase(async (db) => {
      const { staff, waiting } = await addRecords(db);
      const [first] = waiting;
      const nothing = {
        state: { error: "Pilih presensi yang akan divalidasi.", done: null },
        cards: [],
      };

      for (const sent of [undefined, "semua", [], [7, null], ["bukan-kunci"]]) {
        expect(await validateTicked(db, staff, sent, AT, true)).toEqual(
          nothing,
        );
      }
      expect(await validateTicked(db, staff, [UNKNOWN], AT, true)).toEqual({
        state: {
          error: "Presensi ini tidak ditemukan. Muat ulang halaman.",
          done: null,
        },
        cards: [],
      });
      expect(await logLines(db)).toEqual([]);

      const mixed = await validateTicked(
        db,
        staff,
        [UNKNOWN, first, first],
        AT,
        true,
      );

      expect(mixed.state.done).toBe("1 presensi divalidasi.");
      expect(await logLines(db)).toHaveLength(1);
    });
  });
});
