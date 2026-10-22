import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, characterGradeSchemes } from "@/db/schema";
import {
  type GradeScheme,
  STARTING_SCHEME,
  STARTING_VERSION,
} from "./scheme-ids";

/** The grade scheme as it is now, with who set it last and when. */
export interface SchemeInForce {
  scheme: GradeScheme;
  /** What a form opened on this scheme carries, to find a save made since. */
  version: string;
  /** The last setting, or null while the scheme is the starting one. */
  set: { at: Date; by: string } | null;
}

/** The latest setting, with the account behind it, or null for none. */
export interface LatestSetting extends SchemeInForce {
  set: { at: Date; by: string };
  setById: string;
  replaces: string | null;
}

/** The columns of a scheme, as a setting and a semester closing keep them. */
type SchemeColumns = Pick<
  typeof characterGradeSchemes.$inferSelect,
  | "attendanceWeight"
  | "mentoringWeight"
  | "sikuWeight"
  | "skpmWeight"
  | "aFrom"
  | "bFrom"
  | "cFrom"
  | "dFrom"
  | "passLetter"
>;

/** The scheme a stored setting, or a semester closing, holds. */
export function schemeOf(row: SchemeColumns): GradeScheme {
  return {
    weights: {
      attendance: row.attendanceWeight,
      mentoring: row.mentoringWeight,
      siku: row.sikuWeight,
      skpm: row.skpmWeight,
    },
    lowerLimits: { A: row.aFrom, B: row.bFrom, C: row.cFrom, D: row.dFrom },
    passLetter: row.passLetter,
  };
}

/** The setting in force, or null while none has been saved. */
export async function readLatestSetting(
  db: Database,
): Promise<LatestSetting | null> {
  const [latest] = await db
    .select({ row: characterGradeSchemes, by: accounts.name })
    .from(characterGradeSchemes)
    .innerJoin(accounts, eq(accounts.id, characterGradeSchemes.setBy))
    .orderBy(desc(characterGradeSchemes.setAt), desc(characterGradeSchemes.id))
    .limit(1);
  if (!latest) return null;
  const { row, by } = latest;
  return {
    scheme: schemeOf(row),
    version: row.id,
    set: { at: row.setAt, by },
    setById: row.setBy,
    replaces: row.replaces,
  };
}

/** The scheme in force, or the starting one while none has been saved. */
export async function readGradeScheme(db: Database): Promise<SchemeInForce> {
  const latest = await readLatestSetting(db);
  if (!latest) {
    return { scheme: STARTING_SCHEME, version: STARTING_VERSION, set: null };
  }
  const { scheme, version, set } = latest;
  return { scheme, version, set };
}
