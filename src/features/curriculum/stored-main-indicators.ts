import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { accounts, mainIndicators as savedIndicators } from "@/db/schema";
import type { Change } from "./change";
import { mainIndicators, type ValueIndicators } from "./main-indicators";

export interface ShownIndicators {
  values: ValueIndicators[];
  /** The last change, or null while the texts are the starting ones. */
  changed: Change | null;
}

/** The main indicators as they are now, with who changed them last. */
export async function readMainIndicators(
  db: Database,
): Promise<ShownIndicators> {
  const rows = await db
    .select({
      code: savedIndicators.code,
      text: savedIndicators.text,
      at: savedIndicators.changedAt,
      by: accounts.name,
    })
    .from(savedIndicators)
    .innerJoin(accounts, eq(accounts.id, savedIndicators.changedBy));

  let changed: Change | null = null;
  for (const { at, by } of rows) {
    if (!changed || at > changed.at) changed = { at, by };
  }
  const texts = new Map(rows.map((row) => [row.code, row.text]));
  return { values: mainIndicators(texts), changed };
}
