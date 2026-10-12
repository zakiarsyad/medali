import { eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import {
  type DutyBar,
  dutyBar,
  endCompanionDuty,
  readSemester,
} from "@/db/companion-duty";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormCompanions, students } from "@/db/schema";
import { DORM_NAMES, DORM_RESIDENTS, type DormId } from "@/dorms/dorms";
import type { Parsed } from "@/parsed";
import { COMPANIONS_NOT_ALLOWED } from "./companion-messages";

export type LockedCompanion = typeof dormCompanions.$inferSelect;

/** What a change answers when the student it names is no kakak pendamping. */
export const COMPANION_NOT_FOUND = {
  ok: false,
  error: "Kakak pendamping tidak ditemukan. Muat ulang halaman.",
} as const;

const ALREADY_STOPPED = {
  ok: false,
  error: "Kakak pendamping ini sudah tidak aktif.",
} as const;
const ROOM_CHANGED = {
  ok: false,
  error:
    "Kamar kakak pendamping ini baru saja berubah. Muat ulang halaman, lalu coba lagi.",
} as const;
const ALREADY_ACTIVE = {
  ok: false,
  error: "Kakak pendamping ini sudah aktif.",
} as const;
const STUDENT_NOT_ACTIVE = {
  ok: false,
  error:
    "Mahasiswa ini tidak aktif, jadi tidak bisa diaktifkan sebagai kakak pendamping.",
} as const;
const LIVES_IN_DORM = {
  ok: false,
  error:
    "Mahasiswa ini sekarang tinggal di asrama, jadi tidak bisa diaktifkan sebagai kakak pendamping.",
} as const;

/** What "Aktifkan" answers for each reason a student cannot have the duty. */
function restartRefusal(bar: DutyBar, dorm: DormId): Parsed<never> {
  if (bar === "removed") return COMPANION_NOT_FOUND;
  if (bar === "not_active") return STUDENT_NOT_ACTIVE;
  if (bar === "lives_in_dorm") return LIVES_IN_DORM;
  return {
    ok: false,
    error: `${DORM_NAMES[dorm]} hanya untuk ${DORM_RESIDENTS[dorm]}, jadi kakak pendamping ini tidak bisa diaktifkan.`,
  };
}

/**
 * Reads a kakak pendamping and holds the row until the transaction ends.
 * Stopping, restarting and placing in a room all start here, so two of
 * them never run at the same moment: the second waits and then sees what
 * the first one saved.
 */
export async function lockCompanion(
  tx: Database,
  studentId: string,
): Promise<LockedCompanion | null> {
  if (!isUuid(studentId)) return null;
  const [companion] = await tx
    .select()
    .from(dormCompanions)
    .where(eq(dormCompanions.studentId, studentId))
    .for("update");
  return companion ?? null;
}

/** The kakak pendamping to stop, with the room the screen showed for them. */
export interface SentStop {
  studentId: string;
  /** The id of the room shown, or empty when "Belum diplot" was shown. */
  roomId: string;
}

async function stop(tx: Database, sent: SentStop): Promise<Parsed<string>> {
  const companion = await lockCompanion(tx, sent.studentId);
  if (!companion) return COMPANION_NOT_FOUND;
  if (!companion.isActive) return ALREADY_STOPPED;
  if ((companion.roomId ?? "") !== sent.roomId) return ROOM_CHANGED;
  await endCompanionDuty(tx, companion.studentId);
  if (companion.roomId === null) {
    return { ok: true, value: "Kakak pendamping dinonaktifkan." };
  }
  return {
    ok: true,
    value: "Kakak pendamping dinonaktifkan dan dikeluarkan dari kamar.",
  };
}

/**
 * Stops the duty of a kakak pendamping: Tidak aktif, and out of their
 * room. Refused when their room is no longer the one the screen showed,
 * so that stopping never takes someone out of a room the person who
 * pressed the button did not know of.
 */
export async function stopCompanion(
  db: Database,
  actor: Pick<Account, "roles">,
  sent: SentStop,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_companions")) {
    return COMPANIONS_NOT_ALLOWED;
  }
  return db.transaction((tx) => stop(tx, sent));
}

/**
 * Reads the student of a duty and holds the row until the transaction
 * ends, as naming and a change to the student data do. The student is
 * held before the kakak pendamping, in the same order everywhere.
 */
async function lockStudent(tx: Database, studentId: string) {
  if (!isUuid(studentId)) return null;
  const [student] = await tx
    .select({
      status: students.status,
      entryPath: students.entryPath,
      sex: students.sex,
      isInternational: students.isInternational,
      isSeedling: students.isSeedling,
      cohortYear: students.cohortYear,
      deletedAt: students.deletedAt,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .for("update");
  return student ?? null;
}

async function restart(
  tx: Database,
  studentId: string,
  day?: string,
): Promise<Parsed<string>> {
  const student = await lockStudent(tx, studentId);
  if (!student) return COMPANION_NOT_FOUND;
  const companion = await lockCompanion(tx, studentId);
  if (!companion) return COMPANION_NOT_FOUND;
  const semester = await readSemester(tx, student.cohortYear, day);
  const bar = dutyBar(student, companion.dorm, semester);
  if (bar === "removed") return COMPANION_NOT_FOUND;
  if (companion.isActive) return ALREADY_ACTIVE;
  if (bar) return restartRefusal(bar, companion.dorm);
  await tx
    .update(dormCompanions)
    .set({ isActive: true })
    .where(eq(dormCompanions.studentId, companion.studentId));
  return { ok: true, value: "Kakak pendamping diaktifkan kembali." };
}

/**
 * Starts the duty of a stopped kakak pendamping again: Aktif, without a
 * room. Refused for a student the rule that ends a duty would stop: not
 * active, living in a dorm on the day, today when none is given, or not
 * of the jenis kelamin of the dorm they serve.
 */
export async function restartCompanion(
  db: Database,
  actor: Pick<Account, "roles">,
  studentId: string,
  day?: string,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_companions")) {
    return COMPANIONS_NOT_ALLOWED;
  }
  return db.transaction((tx) => restart(tx, studentId, day));
}
