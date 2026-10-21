import { max, sql } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { mainIndicators } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { type IndicatorText, parseIndicatorTexts } from "./indicator-input";
import { NOT_ALLOWED } from "./not-allowed";
import { nextChangedAt, savedVersion } from "./saved-version";

/** What a save answers when the indicators were saved after its form opened. */
export const MAIN_INDICATORS_CHANGED_BY_OTHER = {
  ok: false,
  error:
    "Indikator utama baru saja diubah orang lain, jadi perubahan Anda tidak disimpan. Muat ulang untuk melihat versi terbaru.",
} as const;

const SAVED = { ok: true, value: null } as const;

async function latestChangedAt(tx: Database): Promise<Date | null> {
  const [row] = await tx
    .select({ at: max(mainIndicators.changedAt) })
    .from(mainIndicators);
  return row?.at ?? null;
}

async function saveOpened(
  tx: Database,
  actorId: string,
  version: string,
  texts: IndicatorText[],
): Promise<Parsed<null>> {
  // Two saves at once would both find the version they were opened on; the
  // second waits here for the first, so it sees the first and is refused.
  // A row lock cannot do it: while nothing is saved there is no row.
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext('main_indicators'))`,
  );
  const latest = await latestChangedAt(tx);
  if (version !== savedVersion(latest)) {
    return MAIN_INDICATORS_CHANGED_BY_OTHER;
  }
  const changedAt = nextChangedAt(latest);
  await tx
    .insert(mainIndicators)
    .values(texts.map((text) => ({ ...text, changedAt, changedBy: actorId })))
    .onConflictDoUpdate({
      target: mainIndicators.code,
      set: {
        text: sql`excluded.text`,
        changedAt: sql`excluded.changed_at`,
        changedBy: sql`excluded.changed_by`,
      },
    });
  return SAVED;
}

/**
 * Saves the texts of all main indicators over the ones kept before, with
 * who changed them and when. `version` is the one the form was opened on:
 * when the indicators were saved since, by anyone, the save is refused
 * and nothing is overwritten. `sent` gives the text sent for a code.
 */
export async function saveMainIndicators(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  version: string,
  sent: (code: string) => string,
): Promise<Parsed<null>> {
  if (!may(actor.roles, "change_curriculum")) return NOT_ALLOWED;
  const parsed = parseIndicatorTexts(sent);
  if (!parsed.ok) return parsed;
  return db.transaction((tx) =>
    saveOpened(tx, actor.id, version, parsed.value),
  );
}
