import type { ConsentPick } from "./consent-picks";
import type { ReferralRow } from "./referral-view";

/*
 * What "Tindak lanjuti" of a referral does. Read by the screen parts in
 * the browser, so nothing here may take from the database code.
 */

/** The referred student, as "Persetujuan konseling" picks one. */
export function pickOf(row: ReferralRow): ConsentPick {
  return {
    id: row.studentId,
    name: row.name,
    nim: row.nim,
    program: row.program,
  };
}

/**
 * "Tindak lanjuti" of a row: the referred student is picked on
 * "Persetujuan konseling", which is then brought into view.
 */
export function followUpOf(
  pick: (student: ConsentPick) => void,
  bringIntoView: () => void,
): (row: ReferralRow) => void {
  return (row) => {
    pick(pickOf(row));
    bringIntoView();
  };
}
