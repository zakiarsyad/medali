import type { DormId } from "@/dorms/dorms";
import type { RecapRoom } from "@/health-notes/sick-list";
import type { ScheduleStatus } from "@/mental-health/schedule-ids";
import type { ConsentStatus } from "./consent-ids";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code but its types.
 */

/** One resident on "Rujukan potensi kesehatan mental dari asrama". */
export interface ReferralRow {
  studentId: string;
  name: string;
  nim: string;
  program: string;
  dorm: DormId;
  /** Null for a resident not placed in a room yet. */
  room: RecapRoom | null;
  /** "Pengamatan (rahasia)" of the mark. */
  observation: string;
  /** When the mark was set last. */
  markedAt: Date;
  /** The name of the account that set it last. */
  markedBy: string;
  /** "Persetujuan": the student's consent, or null when never asked. */
  consent: ConsentStatus | null;
  /** The status of the student's active request, or null without one. */
  activeSchedule: ScheduleStatus | null;
}

/** One page of the referrals, with how many there are in all. */
export interface ReferralList {
  rows: ReferralRow[];
  matching: number;
  page: number;
}
