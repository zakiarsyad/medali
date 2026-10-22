import { rerataOf, type Scores } from "@/character-scores/assessment-score";
import type { CoachingNeed } from "@/character-scores/coaching-need";
import { COACHING_LEVEL_WORDS } from "@/character-scores/coaching-words";
import { shownRerata } from "@/character-scores/shown-rerata";
import type { ScheduleStatus } from "@/mental-health/schedule-ids";
import { valueNameOf } from "@/ui/medali-values";

/*
 * The rules of a call for counselling made from Asesmen karakter. Read by
 * the screen parts in the browser, so nothing here may take from the
 * database code.
 */

/**
 * "Dasar" of the call, which Konselor reads: the Rerata, the level and
 * the weakest value of the latest assessment.
 */
export function callReason(scores: Scores, need: CoachingNeed): string {
  const rerata = shownRerata(rerataOf(scores));
  const level = COACHING_LEVEL_WORDS[need.level].toLowerCase();
  const weakest = valueNameOf(need.weakest);
  return `Asesmen karakter: rerata ${rerata}, pembinaan ${level}, aspek terlemah ${weakest}`;
}

/**
 * The statuses whose time is the one Konselor set. While the student
 * asks for another time, the time held is the one the student wished.
 */
const COUNSELLOR_TIME_STATUSES: readonly ScheduleStatus[] = [
  "scheduled",
  "done",
  "missed",
];

/** Whether the row of a call shows its date and Jam. */
export function showsCallTime(status: ScheduleStatus): boolean {
  return COUNSELLOR_TIME_STATUSES.includes(status);
}
