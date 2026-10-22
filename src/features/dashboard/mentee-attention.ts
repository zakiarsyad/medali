import type { GradeLetter } from "@/character-grades/scheme-ids";
import type { CoachingLevel } from "@/character-scores/coaching-need";
import { COACHING_LEVEL_WORDS } from "@/character-scores/coaching-words";
import { shownRerata } from "@/character-scores/shown-rerata";
import {
  CATEGORY_WORDS as PENALTY_WORDS,
  type PenaltyCategory,
} from "@/discipline-penalties/penalty-kinds";
import { CATEGORY_WORDS as FITNESS_WORDS } from "@/health-notes/category-words";
import type { FitnessCategory } from "@/health-notes/fitness-ids";
import type { ScreeningLevel } from "@/mental-health/screening-ids";
import { COUNSELLING_LEVELS } from "@/mental-health/screening-rules";
import { LEVEL_WORDS } from "@/mental-health/screening-words";
import { averageWords } from "./achievement-words";

/*
 * Which anak asuh need attention, and why. Read by the screen parts, so
 * nothing here may take from the database code.
 */

/**
 * Below this Nilai kehadiran an anak asuh needs attention. The
 * prototype's value, to be confirmed by the campus before launch.
 */
export const ATTENDANCE_BELOW = 75;

/** How many anak asuh "Perlu perhatian" shows before "Lihat semua". */
export const ATTENTION_SHOWN = 8;

/** What is known of one Aktif anak asuh for "Perlu perhatian". */
export interface MenteeFacts {
  studentId: string;
  name: string;
  /** Whether the account may open the student's detail. */
  opensDetail: boolean;
  /** The Rerata of the latest assessment, held at 70 under a penalty; null when none. */
  rerata: number | null;
  /** The level, while on the coaching list and not yet Selesai. */
  coaching: CoachingLevel | null;
  /** The letter of a worked-out Nilai karakter; null while "Belum lengkap". */
  grade: { letter: GradeLetter; passes: boolean } | null;
  /** Nilai kehadiran of the character grade; null while there is none. */
  attendance: number | null;
  /** The Kategori of the penalty that limits the scores, if any. */
  penalty: PenaltyCategory | null;
  /** The final fitness category; null while not tested. */
  fitness: FitnessCategory | null;
  /** The latest level, only when published to the Pengasuh with the level. */
  mental: ScreeningLevel | null;
}

/** How serious a reason looks: the colour of coaching, or of a warning. */
export type ReasonTone = "serious" | "warning";

export interface Reason {
  words: string;
  tone: ReasonTone;
}

/** An anak asuh who needs attention, with each reason. */
export interface AttentionRow {
  studentId: string;
  name: string;
  opensDetail: boolean;
  rerata: number | null;
  reasons: Reason[];
}

function lower(words: string): string {
  return words.toLowerCase();
}

function coachingReason(level: CoachingLevel | null): Reason | null {
  if (level === null) return null;
  const words = `Capaian: pembinaan ${lower(COACHING_LEVEL_WORDS[level])}`;
  return { words, tone: "serious" };
}

function gradeReason(grade: MenteeFacts["grade"]): Reason | null {
  if (grade === null || grade.passes) return null;
  return { words: `Nilai karakter ${grade.letter}`, tone: "warning" };
}

function attendanceReason(attendance: number | null): Reason | null {
  if (attendance === null || attendance >= ATTENDANCE_BELOW) return null;
  const words = `Kehadiran kegiatan ${averageWords(attendance)}%`;
  return { words, tone: "warning" };
}

function penaltyReason(category: PenaltyCategory | null): Reason | null {
  if (category === null) return null;
  const words = `Hukuman disiplin ${lower(PENALTY_WORDS[category])}`;
  return { words, tone: "serious" };
}

function fitnessReason(fitness: FitnessCategory | null): Reason | null {
  if (fitness !== "attention" && fitness !== "medical") return null;
  const tone = fitness === "medical" ? "serious" : "warning";
  return { words: `Jasmani: ${lower(FITNESS_WORDS[fitness])}`, tone };
}

function mentalReason(level: ScreeningLevel | null): Reason | null {
  if (level === null || !COUNSELLING_LEVELS.includes(level)) return null;
  return { words: `Mental: ${lower(LEVEL_WORDS[level])}`, tone: "serious" };
}

/** The reasons an anak asuh needs attention, one tag each, in the prototype's order. */
export function reasonsOf(facts: MenteeFacts): Reason[] {
  const reasons = [
    coachingReason(facts.coaching),
    gradeReason(facts.grade),
    attendanceReason(facts.attendance),
    penaltyReason(facts.penalty),
    fitnessReason(facts.fitness),
    mentalReason(facts.mental),
  ];
  return reasons.filter((reason) => reason !== null);
}

/** Lower average first; one not assessed after those who are. */
function byAverage(a: AttentionRow, b: AttentionRow): number {
  if (a.rerata === b.rerata) return 0;
  if (a.rerata === null) return 1;
  if (b.rerata === null) return -1;
  return a.rerata - b.rerata;
}

function byMostReasons(a: AttentionRow, b: AttentionRow): number {
  const most = b.reasons.length - a.reasons.length;
  if (most !== 0) return most;
  const lowest = byAverage(a, b);
  if (lowest !== 0) return lowest;
  return a.name.localeCompare(b.name, "id");
}

/**
 * "Perlu perhatian": each anak asuh with at least one reason, the most
 * reasons first, then the lowest average.
 */
export function attentionRows(facts: readonly MenteeFacts[]): AttentionRow[] {
  const rows: AttentionRow[] = [];
  for (const each of facts) {
    const reasons = reasonsOf(each);
    if (reasons.length === 0) continue;
    const { studentId, name, opensDetail, rerata } = each;
    rows.push({ studentId, name, opensDetail, rerata, reasons });
  }
  return rows.sort(byMostReasons);
}

/** "MEDALI 81,7" beside a name, or "belum diasesmen". */
export function medaliWords(rerata: number | null): string {
  if (rerata === null) return "belum diasesmen";
  return `MEDALI ${shownRerata(rerata)}`;
}
