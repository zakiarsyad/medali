import { eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormRoomPlaces } from "@/db/schema";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import {
  DORM_IDS,
  DORM_NAMES,
  DORM_RESIDENTS,
  DORM_SEXES,
  type DormId,
} from "@/dorms/dorms";
import type { Parsed } from "@/parsed";
import { NO_PERIOD } from "./place-resident";
import { holdStudent, saveChosenDorm } from "./resident-choice";
import {
  NOT_ACTIVE,
  RESIDENTS_NOT_ALLOWED,
  STUDENT_MISSING,
} from "./resident-choice-messages";
import { ADDED_NOTE_MAX_LENGTH } from "./room-limits";

/** A resident added by hand, as the form "Tambah penghuni" sends it. */
export interface SentResident {
  studentId: string;
  dorm: string;
  note: string;
}

interface NewResident {
  studentId: string;
  dorm: DormId;
  note: string | null;
}

const DORM_MISSING = { ok: false, error: "Pilih asrama." } as const;
const NOTE_TOO_LONG = {
  ok: false,
  error: `Keterangan paling panjang ${ADDED_NOTE_MAX_LENGTH} karakter.`,
} as const;

function wrongDorm(dorm: DormId) {
  return {
    ok: false,
    error: `${DORM_NAMES[dorm]} hanya untuk ${DORM_RESIDENTS[dorm]}. Pilih asrama lain.`,
  } as const;
}

function livesThere(name: string, dorm: DormId) {
  return {
    ok: false,
    error: `${name} sudah penghuni ${DORM_NAMES[dorm]}. Muat ulang halaman untuk melihat daftar terbaru.`,
  } as const;
}

/** Checks a resident as sent. An empty Keterangan is kept as none. */
export function parseResident(sent: SentResident): Parsed<NewResident> {
  if (!isUuid(sent.studentId)) return STUDENT_MISSING;
  const dorm = DORM_IDS.find((id) => id === sent.dorm);
  if (!dorm) return DORM_MISSING;
  const note = sent.note.trim();
  if (note.length > ADDED_NOTE_MAX_LENGTH) return NOTE_TOO_LONG;
  return {
    ok: true,
    value: { studentId: sent.studentId, dorm, note: note === "" ? null : note },
  };
}

async function save(
  tx: Database,
  by: string,
  dormCohorts: number[],
  resident: NewResident,
): Promise<Parsed<string>> {
  const student = await holdStudent(tx, dormCohorts, resident.studentId);
  if (!student?.isActive) return NOT_ACTIVE;
  if (DORM_SEXES[resident.dorm] !== student.sex) {
    return wrongDorm(resident.dorm);
  }
  if (student.dorm !== null) return livesThere(student.name, student.dorm);

  // A place left behind in a room would otherwise count again, and the
  // student would not wait in "Belum diplot".
  await tx
    .delete(dormRoomPlaces)
    .where(eq(dormRoomPlaces.studentId, resident.studentId));
  await saveChosenDorm(tx, by, {
    studentId: resident.studentId,
    before: null,
    after: resident.dorm,
    note: resident.note,
  });
  return {
    ok: true,
    value: `${student.name} ditambahkan sebagai penghuni ${DORM_NAMES[resident.dorm]}.`,
  };
}

/**
 * Makes an active student who lives in no dorm a resident of the dorm
 * chosen, in place of the usual rule, and gives back what to tell the
 * staff. The dorm must fit the student's jenis kelamin. The student is
 * held while it is checked, so of two people adding the same student at
 * the same moment one is refused.
 */
export async function addResident(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  sent: SentResident,
  day?: string,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "set_dorm_residents")) return RESIDENTS_NOT_ALLOWED;
  const resident = parseResident(sent);
  if (!resident.ok) return resident;
  const dormCohorts = await readDormCohorts(db, day);
  if (dormCohorts === null) return NO_PERIOD;
  return db.transaction((tx) =>
    save(tx, actor.id, dormCohorts, resident.value),
  );
}
