import {
  SP1_REJECTIONS,
  SP1_VIOLATIONS,
  SP2_REJECTIONS,
  SP2_VIOLATIONS,
  type WarningLevel,
} from "./warning-ids";

/*
 * When a resident is called for a warning letter, and why. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

/** Where a resident stands in a semester. */
export interface WarningStanding {
  /** Violations of the semester gone up to Pengelola Asrama. */
  counted: number;
  /**
   * Activities of the semester whose latest clarification of the
   * resident's absence was rejected, by BAM or by Pengelola Asrama.
   */
  rejected: number;
  /** Whether SP 1 of the semester is issued. */
  hasFirst: boolean;
  /** Whether SP 2 of the semester is issued. */
  hasSecond: boolean;
}

function meetsFirst(standing: WarningStanding): boolean {
  return (
    standing.counted >= SP1_VIOLATIONS || standing.rejected >= SP1_REJECTIONS
  );
}

function meetsSecond(standing: WarningStanding): boolean {
  return (
    standing.counted >= SP2_VIOLATIONS || standing.rejected >= SP2_REJECTIONS
  );
}

/**
 * The SP a resident is called for: SP 1 at 7 counted violations or one
 * rejected clarification; after SP 1, SP 2 at 12 counted violations in
 * all or a second rejected clarification; or none.
 */
export function neededLevel(standing: WarningStanding): WarningLevel | null {
  if (standing.hasSecond) return null;
  if (standing.hasFirst) return meetsSecond(standing) ? 2 : null;
  return meetsFirst(standing) ? 1 : null;
}

/** Why a resident is called for an SP, as the list says it. */
export function causesOf(
  standing: WarningStanding,
  level: WarningLevel,
): string[] {
  const { counted, rejected } = standing;
  const causes: string[] = [];
  const violationsNeeded = level === 1 ? SP1_VIOLATIONS : SP2_VIOLATIONS;
  if (counted >= violationsNeeded)
    causes.push(`${counted} pelanggaran tercatat`);
  if (level === 1 && rejected >= SP1_REJECTIONS) {
    causes.push("klarifikasi kehadiran ditolak");
  }
  if (level === 2 && rejected >= SP2_REJECTIONS) {
    causes.push(`klarifikasi kehadiran ditolak lagi (${rejected} kali)`);
  }
  return causes;
}

/** The highest SP a resident was issued in the semester, or none. */
export function letterMark(standing: WarningStanding): WarningLevel | null {
  if (standing.hasSecond) return 2;
  if (standing.hasFirst) return 1;
  return null;
}
