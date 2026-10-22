import { asc } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
  addTestStudentAccount,
} from "@/features/activities/test-records";
import { fixedGradeVisibleTo } from "./grade-students";

/*
 * This file's own sample values: the programs UJITETAPSATU and
 * UJITETAPDUA, and the NIMs 9951340000 to 9951340099.
 */

const inTestDatabase = withTestDatabase();

async function addRecords(db: Database) {
  const own = await addTestProgram(db, "UJITETAPSATU");
  const other = await addTestProgram(db, "UJITETAPDUA");
  const student = async (
    programId: number,
    nim: string,
    more: Partial<typeof students.$inferInsert> = {},
  ) => {
    const added = await addTestStudentAccount(db, programId, {
      nim,
      name: `Mahasiswa Uji Tetap ${nim}`,
      cohortYear: 5129,
      ...more,
    });
    return added.studentId;
  };
  const kepala = await addTestActor(db, "Kepala Uji Tetap", ["head_of_unit"]);
  const active = await student(own, "9951340001");
  const left = await student(own, "9951340002", { status: "inactive" });
  const onLeave = await student(own, "9951340003", { status: "on_leave" });
  const otherProgram = await student(other, "9951340004");
  await student(own, "9951340005", {
    deletedAt: new Date(),
    deletedBy: kepala.id,
  });
  const mentor = await addTestActor(db, "Pengasuh Uji Tetap", ["mentor"]);
  await addTestMentorGroup(db, {
    studyProgramId: own,
    cohortYear: 5129,
    number: 1,
    mentorId: mentor.id,
    memberIds: [active, left],
  });
  return { own, kepala, mentor, active, left, onLeave, otherProgram };
}

function accountOf(
  id: string,
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id, roles, studyProgramId, studentId: null };
}

async function seenBy(db: Database, account: AccountForAccess) {
  const visible = fixedGradeVisibleTo(account);
  if (visible === null) return null;
  const rows = await db
    .select({ id: students.id })
    .from(students)
    .where(visible)
    .orderBy(asc(students.nim));
  return rows.map((row) => row.id);
}

describe("fixedGradeVisibleTo", () => {
  it("lets a role that reads every student see each of them, also one who has left, but never a removed one", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      for (const roles of [
        ["head_of_unit"],
        ["director"],
        ["assessor"],
      ] satisfies RoleId[][]) {
        const seen = await seenBy(db, accountOf(records.kepala.id, roles));
        expect(seen).toEqual(
          expect.arrayContaining([
            records.active,
            records.left,
            records.onLeave,
            records.otherProgram,
          ]),
        );
        expect(seen).toHaveLength(4);
      }
    });
  });

  it("lets Ketua Program Studi see the students whose program today is theirs, whatever their status", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const ketua = accountOf(
        records.kepala.id,
        ["head_of_program"],
        records.own,
      );

      expect(await seenBy(db, ketua)).toEqual([
        records.active,
        records.left,
        records.onLeave,
      ]);
    });
  });

  it("lets Pengasuh see their mentees today only, also one who has left", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const mentor = accountOf(records.mentor.id, ["mentor"]);

      expect(await seenBy(db, mentor)).toEqual([records.active, records.left]);
    });
  });

  it("lets Pengasuh with no group today see nobody", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const other = await addTestActor(db, "Pengasuh Uji Tanpa Kelompok", [
        "mentor",
      ]);

      expect(await seenBy(db, accountOf(other.id, ["mentor"]))).toEqual([]);
    });
  });

  it("refuses Mahasiswa, Konselor, Pegawai UPK and every BAM role", () => {
    const refused: RoleId[] = [
      "student",
      "counsellor",
      "upk_staff",
      "dorm_manager",
      "discipline_officer",
      "bam_bphk",
      "bam_compliance",
      "bam_household",
      "bam_spiritual",
      "bam_catering",
      "bam_arts_sports",
      "bam_health",
    ];
    for (const role of refused) {
      expect(fixedGradeVisibleTo(accountOf("someone", [role]))).toBeNull();
    }
  });

  it("adds no rows for a role without the right beside one with it", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const both = accountOf(records.mentor.id, ["mentor", "dorm_manager"]);

      expect(await seenBy(db, both)).toEqual([records.active, records.left]);
    });
  });
});
