import type { ReactNode } from "react";
import type { OpenedPenalty } from "./penalty-detail-read";
import type { PenaltyFollowUp } from "./penalty-follow-up";
import type { PenaltyStatus } from "./penalty-ids";

/*
 * How "Rincian" of a penalty is asked for once it is opened. Read by the
 * list in the browser, so nothing here may take from the database code.
 */

/**
 * What the server is asked when "Rincian" opens: the penalty, and its
 * mandatory counselling only for the account that sends to it.
 */
export interface RincianAsks {
  penalty: (penaltyId: string) => Promise<OpenedPenalty | null>;
  counselling?: (penaltyId: string) => Promise<ReactNode>;
}

/** "Rincian" as the server gave it. */
export interface LoadedRincian {
  penalty: OpenedPenalty;
  counselling: ReactNode;
}

/** What the row of a penalty shows and changes of its follow-up. */
export interface RowFollowUp {
  status: PenaltyStatus;
  version: number;
}

/**
 * "Rincian" of one penalty, both parts asked at once. Null when the
 * server gives no penalty: it is not the account's to see, or none.
 */
export async function askRincian(
  asks: RincianAsks,
  penaltyId: string,
): Promise<LoadedRincian | null> {
  const [penalty, counselling = null] = await Promise.all([
    asks.penalty(penaltyId),
    asks.counselling?.(penaltyId),
  ]);
  if (penalty === null) return null;
  return { penalty, counselling };
}

/** The loaded "Rincian" with what a follow-up gave back. */
export function withFollowUp(
  loaded: LoadedRincian,
  next: PenaltyFollowUp,
): LoadedRincian {
  return { ...loaded, penalty: { ...loaded.penalty, ...next } };
}

/**
 * The status of the row after "Rincian" was read: that of the later
 * version, so a status changed while "Rincian" was on its way stays.
 */
export function laterFollowUp(
  shown: RowFollowUp,
  read: RowFollowUp,
): RowFollowUp {
  if (shown.version >= read.version) return shown;
  return { status: read.status, version: read.version };
}
