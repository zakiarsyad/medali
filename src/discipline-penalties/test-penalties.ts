import type { Database } from "@/db/connect";
import {
  accounts,
  disciplinePenalties,
  disciplinePenaltyChanges,
} from "@/db/schema";
import type { PenaltyKind } from "./penalty-kinds";

/** Made-up penalties for the checks of every area that reads the limit. */

/** The Uraian of a made-up penalty, which no reader of the limit may see. */
export const TEST_DESCRIPTION = "Uraian uji: meninggalkan asrama tanpa izin";

/** An account that saves the made-up penalties. */
export async function addTestRecorder(db: Database): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Pembina Uji Batas Nilai" })
    .returning({ id: accounts.id });
  if (!account) throw new Error("The account was not added.");
  return account.id;
}

/** What a penalty of this kind keeps of kerja sosial, from its day. */
function socialWorkOf(kind: PenaltyKind, day: string) {
  const endsForGood = kind.category === "heavy" && kind.level > 1;
  if (endsForGood) {
    return { status: "set" as const, socialWorkStartsOn: null };
  }
  return {
    status: "imposed" as const,
    socialWorkForms: ["grounds" as const],
    socialWorkPlace: "campus" as const,
    socialWorkStartsOn: day,
    socialWorkEndsOn: day,
  };
}

/**
 * A penalty of a student of this Kategori and Jenjang on a day, added
 * straight to the table with its log line. Gives back its key.
 */
export async function addTestPenaltyOf(
  db: Database,
  studentId: string,
  savedBy: string,
  kind: PenaltyKind,
  day = "2026-10-01",
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(disciplinePenalties).values({
    id,
    studentId,
    day,
    description: TEST_DESCRIPTION,
    category: kind.category,
    level: kind.level,
    ...socialWorkOf(kind, day),
    savedBy,
    savedAt: new Date(`${day}T10:00:00+07:00`),
  });
  await db.insert(disciplinePenaltyChanges).values({
    penaltyId: id,
    changedBy: savedBy,
    changedAt: new Date(),
    action: "added",
  });
  return id;
}
