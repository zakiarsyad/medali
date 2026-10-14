import { and, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import type { ClarificationSummary } from "./clarification-card";
import {
  type ClarificationCounts,
  countClarifications,
} from "./clarification-counts";
import {
  NEWEST_SENT_FIRST,
  OF_KEPT_SCHEDULE,
  storedSummaries,
  summaryOf,
} from "./clarification-rows";
import { shownCount } from "./schedule-words";

/** How many clarifications the panel on "Kegiatan PPKS" lists. */
export const PANEL_SIZE = 6;

/** What the panel "Klarifikasi kehadiran" on "Kegiatan PPKS" shows. */
export interface ClarificationPanel {
  counts: ClarificationCounts;
  /** The newest few, without their explanation and their file. */
  latest: ClarificationSummary[];
}

/** How many wait, were accepted and were rejected, in one line. */
export function panelLine(counts: ClarificationCounts): string {
  return [
    `${shownCount(counts.submitted)} menunggu Penilai Mahasiswa`,
    `${shownCount(counts.accepted)} diterima`,
    `${shownCount(counts.rejected)} ditolak`,
  ].join(" · ");
}

/**
 * The clarifications of the students an account sees on "Kegiatan
 * PPKS", over every period and tahap: how many stand in each status and
 * the newest six, in two reads at the same time. `visible` limits the
 * students, so Ketua Program Studi and Pengasuh get the counts and the
 * list of their own students only. Null when the account sees none: the
 * panel is not shown then. Neither the explanation nor anything of the
 * file is read, as the roles that read this may see neither.
 */
export async function readClarificationPanel(
  db: Database,
  visible: SQL,
): Promise<ClarificationPanel | null> {
  const [counts, rows] = await Promise.all([
    countClarifications(db, visible),
    storedSummaries(db, and(OF_KEPT_SCHEDULE, visible))
      .orderBy(...NEWEST_SENT_FIRST)
      .limit(PANEL_SIZE),
  ]);
  if (rows.length === 0) return null;
  return { counts, latest: rows.map(summaryOf) };
}
