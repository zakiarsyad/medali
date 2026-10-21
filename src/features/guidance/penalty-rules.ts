import { daysAfter } from "@/academic-periods/days-after";
import {
  PENALTY_CATEGORIES,
  type PenaltyCategory,
  type PenaltyLevel,
  type PenaltyStatus,
} from "./penalty-ids";

/*
 * The fixed rules of the nine Jenjang of a discipline penalty: the
 * prototype's values, to be confirmed by the campus before launch. Read
 * by the screen parts in the browser, so nothing here may take from the
 * database code.
 */

/** The highest nilai karakter under a Ringan or Sedang penalty. */
export const CHARACTER_SCORE_CAP = 70;

export type SocialWorkUnit = "day" | "month";

/** How long a kerja sosial lasts. */
export interface SocialWorkLength {
  amount: number;
  unit: SocialWorkUnit;
}

/**
 * What a penalty does besides itself: caps nilai karakter at 70,
 * suspends the student for two semesters, or ends their status for good.
 */
export type PenaltyOutcome = "capped" | "suspended" | "dismissed";

export interface PenaltyRule {
  category: PenaltyCategory;
  level: PenaltyLevel;
  /** Hukuman, as the screen names it. */
  penalty: string;
  /** Null for a Jenjang without kerja sosial. */
  socialWork: SocialWorkLength | null;
  outcome: PenaltyOutcome;
  /** Dasar: the part of the rule that sets it. */
  basis: string;
}

/** The paragraph of the rule each Kategori is set in. */
const PARAGRAPH: Record<PenaltyCategory, number> = {
  light: 2,
  medium: 3,
  heavy: 4,
};

const LETTERS = ["a", "b", "c"] as const;

function basisOf(category: PenaltyCategory, level: PenaltyLevel): string {
  return `ayat (${PARAGRAPH[category]}) huruf ${LETTERS[level - 1]}`;
}

function days(amount: number): SocialWorkLength {
  return { amount, unit: "day" };
}

function rule(
  category: PenaltyCategory,
  level: PenaltyLevel,
  penalty: string,
  socialWork: SocialWorkLength | null,
  outcome: PenaltyOutcome,
): PenaltyRule {
  return {
    category,
    level,
    penalty,
    socialWork,
    outcome,
    basis: basisOf(category, level),
  };
}

/** The nine Jenjang, from Ringan pertama to Berat ketiga. */
export const PENALTY_RULES: readonly PenaltyRule[] = [
  rule("light", 1, "Teguran lisan tertulis", days(7), "capped"),
  rule("light", 2, "Teguran tertulis", days(10), "capped"),
  rule(
    "light",
    3,
    "Pernyataan tidak puas secara lisan tertulis",
    days(15),
    "capped",
  ),
  rule(
    "medium",
    1,
    "Pernyataan tidak puas secara tertulis",
    days(20),
    "capped",
  ),
  rule("medium", 2, "Peringatan kesatu tertulis", days(30), "capped"),
  rule("medium", 3, "Peringatan kedua tertulis", days(60), "capped"),
  rule(
    "heavy",
    1,
    "Diberhentikan sementara sebagai mahasiswa selama 2 semester",
    { amount: 8, unit: "month" },
    "suspended",
  ),
  rule(
    "heavy",
    2,
    "Diberhentikan dengan hormat tidak atas permintaan sendiri secara permanen",
    null,
    "dismissed",
  ),
  rule(
    "heavy",
    3,
    "Diberhentikan dengan tidak hormat secara permanen",
    null,
    "dismissed",
  ),
];

/** The place of a Jenjang from Ringan pertama, 0, to Berat ketiga, 8. */
export function rankOf(category: PenaltyCategory, level: PenaltyLevel): number {
  return PENALTY_CATEGORIES.indexOf(category) * 3 + (level - 1);
}

/** The rule of one Jenjang. */
export function ruleOf(
  category: PenaltyCategory,
  level: PenaltyLevel,
): PenaltyRule {
  const found = PENALTY_RULES[rankOf(category, level)];
  if (!found) throw new Error("There is no such Jenjang.");
  return found;
}

/** Ditetapkan for a penalty that ends the status for good, Dijatuhkan for any other. */
export function statusOf(rule: PenaltyRule): PenaltyStatus {
  return rule.outcome === "dismissed" ? "set" : "imposed";
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** The same day some months later, or the last day of a month too short for it. */
function monthsAfter(day: string, months: number): string {
  const at = new Date(`${day}T00:00:00Z`);
  const total = at.getUTCMonth() + months;
  const year = at.getUTCFullYear() + Math.floor(total / 12);
  const month = total % 12;
  const date = Math.min(at.getUTCDate(), lastDayOfMonth(year, month));
  return new Date(Date.UTC(year, month, date)).toISOString().slice(0, 10);
}

/**
 * The last day of a kerja sosial that starts on `start`: the first day
 * counts as one, so 7 days from the 1st end on the 7th, and 8 months
 * from 15 January end on 14 September.
 */
export function socialWorkEnd(start: string, length: SocialWorkLength): string {
  if (length.unit === "day") return daysAfter(start, length.amount - 1);
  return daysAfter(monthsAfter(start, length.amount), -1);
}
