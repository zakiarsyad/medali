import { eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormCompanions, students } from "@/db/schema";
import type { Parsed } from "@/parsed";
import {
  COMPANION_DORM_IDS,
  type CompanionDormId,
  companionDormOf,
} from "./companion-dorms";
import { NOTE_MAX_LENGTH } from "./companion-limits";
import {
  COMPANIONS_NOT_ALLOWED,
  NO_PERIOD_TO_NAME,
} from "./companion-messages";
import { readDormCohorts } from "./dorm-cohorts";
import { DORM_NAMES, DORM_RESIDENTS } from "./dorms";
import { dormInSql } from "./resident-condition";

/** A kakak pendamping as the form sends it. */
export interface SentCompanion {
  studentId: string;
  dorm: string;
  note: string;
}

interface NewCompanion {
  studentId: string;
  dorm: CompanionDormId;
  note: string | null;
}

const STUDENT_MISSING = { ok: false, error: "Pilih mahasiswa." } as const;
const DORM_MISSING = { ok: false, error: "Pilih asrama." } as const;
const NOTE_TOO_LONG = {
  ok: false,
  error: `Keterangan paling panjang ${NOTE_MAX_LENGTH} karakter.`,
} as const;
const NOT_ACTIVE = {
  ok: false,
  error: "Mahasiswa tidak ditemukan atau tidak aktif. Muat ulang halaman.",
} as const;
const LIVES_IN_DORM = {
  ok: false,
  error:
    "Mahasiswa ini tinggal di asrama, jadi tidak bisa ditetapkan sebagai kakak pendamping.",
} as const;
const ALREADY_NAMED = {
  ok: false,
  error: "Mahasiswa ini sudah menjadi kakak pendamping.",
} as const;

function wrongDorm(dorm: CompanionDormId) {
  return {
    ok: false,
    error: `${DORM_NAMES[dorm]} hanya untuk ${DORM_RESIDENTS[dorm]}.`,
  } as const;
}

/** Checks a kakak pendamping as sent. An empty Keterangan is kept as none. */
export function parseCompanion(sent: SentCompanion): Parsed<NewCompanion> {
  if (!isUuid(sent.studentId)) return STUDENT_MISSING;
  const dorm = COMPANION_DORM_IDS.find((id) => id === sent.dorm);
  if (!dorm) return DORM_MISSING;
  const note = sent.note.trim();
  if (note.length > NOTE_MAX_LENGTH) return NOTE_TOO_LONG;
  return {
    ok: true,
    value: { studentId: sent.studentId, dorm, note: note === "" ? null : note },
  };
}

async function save(
  db: Database,
  dormCohorts: number[],
  companion: NewCompanion,
): Promise<Parsed<string>> {
  const [student] = await db
    .select({
      name: students.name,
      sex: students.sex,
      status: students.status,
      deletedAt: students.deletedAt,
      livesIn: dormInSql(dormCohorts),
    })
    .from(students)
    .where(eq(students.id, companion.studentId))
    .limit(1);
  if (!student || student.deletedAt !== null) return NOT_ACTIVE;
  if (student.status !== "active") return NOT_ACTIVE;
  if (student.livesIn !== null) return LIVES_IN_DORM;
  if (companion.dorm !== companionDormOf(student.sex)) {
    return wrongDorm(companion.dorm);
  }

  const named = await db
    .insert(dormCompanions)
    .values(companion)
    .onConflictDoNothing()
    .returning({ studentId: dormCompanions.studentId });
  if (named.length === 0) return ALREADY_NAMED;
  return {
    ok: true,
    value: `${student.name} ditetapkan sebagai kakak pendamping ${DORM_NAMES[companion.dorm]}.`,
  };
}

/**
 * Names a student kakak pendamping of Dana Rakca or Cipta Bakti, and gives
 * back what to tell the staff. Only an active student who does not live in
 * a dorm on the day, today when none is given, and only for the dorm that
 * fits their jenis kelamin. A student is named once: the database keeps
 * that, so two people naming the same student at once cannot both succeed.
 */
export async function nameCompanion(
  db: Database,
  actor: Pick<Account, "roles">,
  sent: SentCompanion,
  day?: string,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "manage_dorm_companions")) {
    return COMPANIONS_NOT_ALLOWED;
  }
  const companion = parseCompanion(sent);
  if (!companion.ok) return companion;
  const dormCohorts = await readDormCohorts(db, day);
  if (dormCohorts === null) return NO_PERIOD_TO_NAME;
  return save(db, dormCohorts, companion.value);
}
