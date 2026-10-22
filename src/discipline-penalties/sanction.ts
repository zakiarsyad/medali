import type {
  ContinuationDecision,
  PenaltyLevel,
  PenaltyStatus,
} from "@/features/guidance/penalty-ids";

/*
 * The badge beside the status of a student with a Berat penalty: the
 * prototype's rule, to be confirmed by the campus before launch. Read by
 * the screen parts in the browser, so nothing here may take from the
 * database code.
 */

export type Sanction = "suspended" | "dismissed" | "dismissed_ayat_8";

export const SANCTION_WORDS: Record<Sanction, string> = {
  suspended: "Diberhentikan sementara",
  dismissed: "Diberhentikan permanen",
  dismissed_ayat_8: "Diberhentikan (ayat 8)",
};

/** What the rule reads of one Berat penalty. */
export interface HeavyPenalty {
  level: PenaltyLevel;
  status: PenaltyStatus;
  decision: ContinuationDecision;
}

/** The highest Jenjang of the penalties, the first given of two as high. */
function weightiest(penalties: readonly HeavyPenalty[]): HeavyPenalty | null {
  let top: HeavyPenalty | null = null;
  for (const penalty of penalties) {
    if (top === null || penalty.level > top.level) top = penalty;
  }
  return top;
}

/**
 * The badge of a student by their Berat penalties, the latest first, and
 * whether they have an Instansi asal; null for none. Jenjang kedua or
 * ketiga is for good. Jenjang pertama follows its Keputusan; while there
 * is none it lasts until the penalty is Selesai dijalani, and for a
 * student with an Instansi asal until the Keputusan is made.
 */
export function sanctionOf(
  penalties: readonly HeavyPenalty[],
  hasAgency: boolean,
): Sanction | null {
  const top = weightiest(penalties);
  if (top === null) return null;
  if (top.level > 1) return "dismissed";
  if (top.decision === "dismissed") return "dismissed_ayat_8";
  if (top.decision === "continue") return null;
  const servedWithoutAgency = top.status === "served" && !hasAgency;
  if (servedWithoutAgency) return null;
  return "suspended";
}
