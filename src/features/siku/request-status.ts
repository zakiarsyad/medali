import type { RequestStatus } from "./request-ids";

/*
 * Where a request stands as the screens show it. Read by the cards in
 * the browser, so nothing here may take from the database code.
 */

export const SHOWN_STATUSES = [
  "waiting",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type ShownStatus = (typeof SHOWN_STATUSES)[number];

export const SHOWN_STATUS_WORDS: Record<ShownStatus, string> = {
  waiting: "Diajukan",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

/** How many of a student's requests wait, as SIKU akhir says it. */
export function waitingWords(waiting: number): string {
  if (waiting === 0) return "tidak ada pengajuan menunggu";
  return `${waiting.toLocaleString("id-ID")} pengajuan menunggu`;
}

/** What a request is shown as, from what is kept of it and its gain. */
export interface KeptStatus {
  status: RequestStatus;
  /** Whether the gain an approval made was cancelled since. */
  gainCancelled: boolean;
}

/**
 * Where a request stands on screen: an approved one whose gain was
 * cancelled is Dibatalkan. A withdrawn request is shown to nobody, so it
 * has none.
 */
export function shownStatus(kept: KeptStatus): ShownStatus | null {
  if (kept.status === "withdrawn") return null;
  if (kept.status === "approved" && kept.gainCancelled) return "cancelled";
  return kept.status;
}
