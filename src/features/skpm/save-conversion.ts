import { sql } from "drizzle-orm";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { skpmConversions } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { parsePointsForHundred } from "./conversion-input";
import { readConversion } from "./skpm-conversion";
import { NOT_ALLOWED_TO_UPLOAD } from "./skpm-messages";

/** What "Simpan konversi" says once the number is saved. */
export function savedConversionMessage(pointsForHundred: number): string {
  return `Konversi SKPM disimpan: ${pointsForHundred.toLocaleString("id-ID")} poin = nilai 100.`;
}

async function save(
  tx: Database,
  actor: AccountForAccess,
  pointsForHundred: number,
): Promise<void> {
  // Two settings saved at once would both read the same number as the one
  // before; the second waits here for the first, so the log stays true.
  // The setting in force is the latest by time, so the time comes from the
  // database clock once the wait is over: one server's clock may run behind
  // another's, and the setting saved last must be the latest.
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('skpm_conversion'))`,
  );
  const before = await readConversion(tx);
  await tx.insert(skpmConversions).values({
    pointsForHundred,
    pointsBefore: before.pointsForHundred,
    setBy: actor.id,
    setAt: WRITTEN_NOW,
  });
}

/**
 * "Simpan konversi": sets "Poin untuk nilai 100", which changes every
 * Nilai SKPM, as a line of its own with the number before it, who set it
 * and when. Refused for a role without the right "Unggah data SKPM", and
 * for anything but a whole number from 1 to 1000, saving nothing.
 */
export async function saveConversion(
  db: Database,
  actor: AccountForAccess,
  sent: string,
): Promise<Parsed<number>> {
  if (!may(actor.roles, "upload_skpm")) return NOT_ALLOWED_TO_UPLOAD;
  const parsed = parsePointsForHundred(sent);
  if (!parsed.ok) return parsed;
  await db.transaction((tx) => save(tx, actor, parsed.value));
  return parsed;
}
