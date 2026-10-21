import { and, eq, sql } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { stageBreakdowns } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { MEDALI_VALUES } from "@/ui/medali-values";
import {
  type BreakdownInput,
  parseBreakdown,
  type SentBreakdown,
} from "./breakdown-input";
import { NOT_ALLOWED } from "./not-allowed";
import { nextChangedAt, savedVersion } from "./saved-version";

/** What a save answers when the box was saved after its form opened. */
export const BREAKDOWN_CHANGED_BY_OTHER = {
  ok: false,
  error:
    "Penjabaran ini baru saja diubah orang lain, jadi perubahan Anda tidak disimpan. Muat ulang untuk melihat versi terbaru.",
} as const;

/**
 * Two saves of one box at once would both find the version they were
 * opened on; the second waits here for the first, so it sees the first and
 * is refused. A row lock cannot do it: while the box is never saved there
 * is no row. The key is the box, so saves of other boxes do not wait.
 */
async function lockBox(tx: Database, input: BreakdownInput): Promise<void> {
  const key = `stage_breakdown:${input.tahap}:${input.valueKey}`;
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`,
  );
}

async function boxChangedAt(
  tx: Database,
  input: BreakdownInput,
): Promise<Date | null> {
  const [row] = await tx
    .select({ at: stageBreakdowns.changedAt })
    .from(stageBreakdowns)
    .where(
      and(
        eq(stageBreakdowns.tahap, input.tahap),
        eq(stageBreakdowns.valueKey, input.valueKey),
      ),
    );
  return row?.at ?? null;
}

async function saveOpened(
  tx: Database,
  actorId: string,
  version: string,
  input: BreakdownInput,
): Promise<boolean> {
  await lockBox(tx, input);
  const latest = await boxChangedAt(tx, input);
  if (version !== savedVersion(latest)) return false;
  await tx
    .insert(stageBreakdowns)
    .values({ ...input, changedAt: nextChangedAt(latest), changedBy: actorId })
    .onConflictDoUpdate({
      target: [stageBreakdowns.tahap, stageBreakdowns.valueKey],
      set: {
        text: sql`excluded.text`,
        activities: sql`excluded.activities`,
        indicatorCodes: sql`excluded.indicator_codes`,
        changedAt: sql`excluded.changed_at`,
        changedBy: sql`excluded.changed_by`,
      },
    });
  return true;
}

/**
 * Saves the breakdown of one nilai at one tahap over the one kept before,
 * with who changed it and when. `version` is the one the form was opened
 * on: when the box was saved since, by anyone, the save is refused and
 * nothing is overwritten. Gives back the name of the nilai.
 */
export async function saveStageBreakdown(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  version: string,
  sent: SentBreakdown,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "change_curriculum")) return NOT_ALLOWED;
  const parsed = parseBreakdown(sent);
  if (!parsed.ok) return parsed;

  const isSaved = await db.transaction((tx) =>
    saveOpened(tx, actor.id, version, parsed.value),
  );
  if (!isSaved) return BREAKDOWN_CHANGED_BY_OTHER;
  const value = MEDALI_VALUES.find(({ key }) => key === parsed.value.valueKey);
  return { ok: true, value: value?.name ?? "" };
}
