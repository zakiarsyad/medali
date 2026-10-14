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
import { ofKind } from "./list-schedules";
import type { ScheduleKind } from "./schedule-list-address";
import { shownCount } from "./schedule-words";

/** How many clarifications the panel of a tab of schedules lists. */
export const PANEL_SIZE = 6;

/** What the panel "Klarifikasi kehadiran" on a tab of schedules shows. */
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
 * PPKS" or "Kegiatan tambahan", of the activities of that tab, over every
 * period and tahap: how many stand in each status and the newest six, in
 * two reads at the same time. `visible` limits the students, so Ketua
 * Program Studi and Pengasuh get the counts and the list of their own
 * students only. Null when the account sees none: the panel is not shown
 * then. Neither the explanation nor anything of the file is read, as the
 * roles that read this may see neither.
 */
export async function readClarificationPanel(
  db: Database,
  visible: SQL,
  kind: ScheduleKind,
): Promise<ClarificationPanel | null> {
  const ofTab = and(visible, ofKind(kind));
  const [counts, rows] = await Promise.all([
    countClarifications(db, ofTab),
    storedSummaries(db, and(OF_KEPT_SCHEDULE, ofTab))
      .orderBy(...NEWEST_SENT_FIRST)
      .limit(PANEL_SIZE),
  ]);
  if (rows.length === 0) return null;
  return { counts, latest: rows.map(summaryOf) };
}
