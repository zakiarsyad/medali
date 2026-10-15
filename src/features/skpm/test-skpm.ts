import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  skpmRows,
  skpmUploads,
} from "@/db/schema";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { SkpmUploadMode } from "./skpm-ids";

/** Made-up records for the checks of this area. */

export interface TestActor {
  id: string;
  roles: RoleId[];
  studyProgramId: number | null;
  studentId: string | null;
}

export async function addTestActor(
  db: Database,
  name: string,
  roles: RoleId[],
  more: Partial<Pick<TestActor, "studyProgramId" | "studentId">> = {},
): Promise<TestActor> {
  const [account] = await db
    .insert(accounts)
    .values({ name, ...more })
    .returning();
  if (!account) throw new Error("The account was not added.");
  return {
    id: account.id,
    roles,
    studyProgramId: account.studyProgramId,
    studentId: account.studentId,
  };
}

/** The odd period of a year far from those of other files. */
export async function addTestPeriod(db: Database, year: number) {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: year,
      term: "odd",
      startsOn: `${year}-08-01`,
      endsOn: `${year + 1}-01-31`,
    })
    .returning();
  if (!period) throw new Error("The period was not added.");
  return period.id;
}

/**
 * A program and Aktif students of an angkatan in it, named by place.
 * `nims` are the NIMs of the file's own block.
 */
export async function addTestStudents(
  db: Database,
  program: string,
  year: number,
  nims: string[],
): Promise<{ programId: number; studentIds: string[] }> {
  const programId = await addTestProgram(db, program);
  const studentIds: string[] = [];
  for (const [place, nim] of nims.entries()) {
    studentIds.push(
      await addTestStudent(db, programId, {
        nim,
        name: `Mahasiswa Uji SKPM ${place + 1}`,
        cohortYear: year,
      }),
    );
  }
  return { programId, studentIds };
}

/** A kelompok pengasuhan of some students, held today by a mentor. */
export async function addTestGroup(
  db: Database,
  of: { programId: number; year: number },
  mentorId: string,
  studentIds: string[],
): Promise<void> {
  const startsOn = `${of.year}-08-01`;
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: of.programId,
      cohortYear: of.year,
      entryPath: "regular",
      number: 1,
      startsOn,
    })
    .returning();
  if (!group) throw new Error("The group was not added.");
  await db
    .insert(mentorGroupMembers)
    .values(studentIds.map((studentId) => ({ studentId, groupId: group.id })));
  await db
    .insert(mentorGroupMentors)
    .values({ groupId: group.id, mentorId, startsOn });
}

export interface TestRow {
  studentId: string;
  points: number;
  activity?: string;
}

export interface TestUpload {
  mode: SkpmUploadMode;
  periodId: string;
  enteredAt: Date;
  rows: TestRow[];
  removed?: boolean;
}

/** An upload kept as it is, without the rules that check a sent file. */
export async function addTestUpload(
  db: Database,
  by: TestActor,
  upload: TestUpload,
): Promise<string> {
  const id = crypto.randomUUID();
  const students = new Set(upload.rows.map((row) => row.studentId));
  await db.insert(skpmUploads).values({
    id,
    fileName: "skpm-uji.csv",
    fingerprint: "b".repeat(64),
    mode: upload.mode,
    periodId: upload.periodId,
    rowCount: upload.rows.length,
    studentCount: students.size,
    enteredBy: by.id,
    enteredAt: upload.enteredAt,
    removedBy: upload.removed ? by.id : null,
    removedAt: upload.removed ? upload.enteredAt : null,
  });
  await db.insert(skpmRows).values(
    upload.rows.map((row, place) => ({
      uploadId: id,
      line: place + 2,
      studentId: row.studentId,
      activity: row.activity ?? "Kegiatan uji",
      category: "Lainnya",
      points: row.points,
    })),
  );
  return id;
}
