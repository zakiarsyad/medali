import { eq } from "drizzle-orm";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods, dormLeaves } from "@/db/schema";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { SentLeave } from "./leave-input";

/** Made-up leave requests for the checks of this area. */

/** A student account as the leave code reads it. */
export interface TestResident {
  roles: RoleId[];
  studentId: string;
}

/**
 * The odd period of a year far from those of other files, a program, and
 * Reguler women of that angkatan, who live in Dana Rakca then. `nims` are
 * the NIMs of the file's own block.
 */
export async function addTestResidents(
  db: Database,
  year: number,
  program: string,
  nims: string[],
): Promise<TestResident[]> {
  await db.insert(academicPeriods).values({
    startYear: year,
    term: "odd",
    startsOn: `${year}-08-01`,
    endsOn: `${year + 1}-01-31`,
  });
  const programId = await addTestProgram(db, program);
  const residents: TestResident[] = [];
  for (const [place, nim] of nims.entries()) {
    const studentId = await addTestStudent(db, programId, {
      nim,
      name: `Penghuni Uji Izin ${place + 1}`,
      cohortYear: year,
    });
    residents.push({ roles: ["student"], studentId });
  }
  return residents;
}

/** Izin pesiar from 09:00 to 16:00 on campus on a day, with nothing wrong in it. */
export function sentOuting(day: string, more: Partial<SentLeave> = {}) {
  return {
    kind: "outing",
    startsAt: `${day}T09:00`,
    endsAt: `${day}T16:00`,
    specialReason: "",
    purpose: "Membeli buku kuliah",
    destination: "Bintaro",
    contact: "0812-0000-0000",
    ...more,
  };
}

/** The requests of a student as they are kept, the earliest sent first. */
export function leavesOf(db: Database, studentId: string) {
  return db
    .select()
    .from(dormLeaves)
    .where(eq(dormLeaves.studentId, studentId))
    .orderBy(dormLeaves.sentAt);
}

/** A request as it is kept, or undefined for none. */
export async function leaveById(db: Database, id: string) {
  const [kept] = await db
    .select()
    .from(dormLeaves)
    .where(eq(dormLeaves.id, id));
  return kept;
}
