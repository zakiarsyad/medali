import { eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormRoomPlaces } from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import type { Parsed } from "@/parsed";
import { NO_PERIOD } from "./place-resident";
import { holdStudent, saveChosenDorm } from "./resident-choice";
import {
  NOT_ACTIVE,
  RESIDENTS_NOT_ALLOWED,
  STUDENT_MISSING,
} from "./resident-choice-messages";

const IS_COMPANION = {
  ok: false,
  error:
    "Mahasiswa ini kakak pendamping aktif. Nonaktifkan dulu di menu Kakak pendamping.",
} as const;

function alreadyNonResident(name: string) {
  return {
    ok: false,
    error: `${name} sudah non asrama. Muat ulang halaman untuk melihat daftar terbaru.`,
  } as const;
}

async function save(
  tx: Database,
  by: string,
  dormCohorts: number[],
  studentId: string,
): Promise<Parsed<string>> {
  const student = await holdStudent(tx, dormCohorts, studentId);
  if (!student?.isActive) return NOT_ACTIVE;
  if (student.isCompanion) return IS_COMPANION;
  if (student.dorm === null) return alreadyNonResident(student.name);

  await tx
    .delete(dormRoomPlaces)
    .where(eq(dormRoomPlaces.studentId, studentId));
  await saveChosenDorm(tx, by, {
    studentId,
    before: student.dorm,
    after: null,
    note: null,
  });
  return { ok: true, value: `${student.name} dijadikan non asrama.` };
}

/**
 * Makes a resident "Non asrama", in place of the usual rule or of a dorm
 * chosen by hand, and takes them out of their room. Gives back what to
 * tell the staff. Refused for an Aktif kakak pendamping: the duty is
 * stopped first. The student is held while it is checked, so of two people
 * changing the same student at the same moment the second sees what the
 * first one saved.
 */
export async function makeNonResident(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  studentId: string,
  day?: string,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "set_dorm_residents")) return RESIDENTS_NOT_ALLOWED;
  if (!isUuid(studentId)) return STUDENT_MISSING;
  const dormCohorts = await readDormCohorts(db, day);
  if (dormCohorts === null) return NO_PERIOD;
  return db.transaction((tx) => save(tx, actor.id, dormCohorts, studentId));
}
