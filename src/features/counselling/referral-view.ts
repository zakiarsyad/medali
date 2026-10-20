import type { DormId } from "@/dorms/dorms";
import type { RecapRoom } from "@/health-notes/sick-list";

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
}

/** One page of the referrals, with how many there are in all. */
export interface ReferralList {
  rows: ReferralRow[];
  matching: number;
  page: number;
}
