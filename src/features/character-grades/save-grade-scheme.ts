import { sql } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import {
  type LatestSetting,
  readLatestSetting,
} from "@/character-grades/grade-scheme";
import {
  GRADE_PARTS,
  type GradeScheme,
  LIMITED_LETTERS,
  STARTING_SCHEME,
  STARTING_VERSION,
} from "@/character-grades/scheme-ids";
import type { Database } from "@/db/connect";
import { characterGradeSchemes } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { parseScheme, type SentScheme } from "./scheme-input";

export const NOT_ALLOWED_TO_SET = {
  ok: false,
  error:
    "Skema bobot hanya dapat diubah oleh Kepala Unit Pembangunan Karakter.",
} as const;

/** What a form opened on a version that is no setting of the scheme is told. */
export const CHANGED_SINCE = {
  ok: false,
  error: "Skema sudah diubah. Muat ulang.",
} as const;

/** What "Simpan skema" says once the scheme is saved. */
export const SAVED_MESSAGE =
  "Skema bobot disimpan. Semua nilai akhir dihitung ulang.";

const SAVED = { ok: true, value: null } as const;

/** What a form opened before someone else saved the scheme is told. */
export function changedBy(name: string): Parsed<null> {
  return { ok: false, error: `Skema sudah diubah oleh ${name}. Muat ulang.` };
}

function isSameScheme(one: GradeScheme, other: GradeScheme): boolean {
  for (const part of GRADE_PARTS) {
    if (one.weights[part] !== other.weights[part]) return false;
  }
  for (const letter of LIMITED_LETTERS) {
    if (one.lowerLimits[letter] !== other.lowerLimits[letter]) return false;
  }
  return one.passLetter === other.passLetter;
}

/** The setting a form opened on `version` replaces: null for the starting scheme. */
function replacedBy(version: string): string | null {
  return version === STARTING_VERSION ? null : version;
}

/**
 * Whether the setting in force is this very save, sent again: the same
 * scheme by the same account from the same form, as a second press does.
 */
function isRepeat(
  latest: LatestSetting,
  actor: AccountForAccess,
  scheme: GradeScheme,
  version: string,
): boolean {
  if (latest.replaces !== replacedBy(version)) return false;
  if (latest.setById !== actor.id) return false;
  return isSameScheme(latest.scheme, scheme);
}

async function save(
  tx: Database,
  actor: AccountForAccess,
  scheme: GradeScheme,
  version: string,
): Promise<Parsed<null>> {
  // Two saves at once would both find the same scheme in force; the second
  // waits here for the first, so it sees the first and is refused. The
  // setting in force is the latest by time, so the time comes from the
  // database clock once the wait is over.
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('character_grade_scheme'))`,
  );
  const latest = await readLatestSetting(tx);
  const inForce = latest?.version ?? STARTING_VERSION;
  if (version !== inForce) {
    if (latest === null) return CHANGED_SINCE;
    if (isRepeat(latest, actor, scheme, version)) return SAVED;
    return changedBy(latest.set.by);
  }
  await tx.insert(characterGradeSchemes).values({
    attendanceWeight: scheme.weights.attendance,
    mentoringWeight: scheme.weights.mentoring,
    sikuWeight: scheme.weights.siku,
    skpmWeight: scheme.weights.skpm,
    aFrom: scheme.lowerLimits.A,
    bFrom: scheme.lowerLimits.B,
    cFrom: scheme.lowerLimits.C,
    dFrom: scheme.lowerLimits.D,
    passLetter: scheme.passLetter,
    before: latest?.scheme ?? STARTING_SCHEME,
    replaces: latest?.version ?? null,
    setBy: actor.id,
    setAt: WRITTEN_NOW,
  });
  return SAVED;
}

/**
 * "Simpan skema": sets the scheme of the character grade, which changes
 * every student's final grade, as a line of its own with the scheme
 * before it, who set it and when. `version` is the scheme the form was
 * opened on. Refused for a role without the right "Bobot penilaian", for
 * a scheme that does not pass its checks, and for a form opened before
 * someone else saved, saving nothing. The same form sent twice saves once.
 */
export async function saveGradeScheme(
  db: Database,
  actor: AccountForAccess,
  sent: SentScheme,
  version: string,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "set_grade_weights")) return NOT_ALLOWED_TO_SET;
  const parsed = parseScheme(sent);
  if (!parsed.ok) return parsed;
  return db.transaction((tx) => save(tx, actor, parsed.value, version));
}
