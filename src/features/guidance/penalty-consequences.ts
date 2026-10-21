import { isDay } from "@/db/is-day";
import {
  kindWords,
  type PenaltyCategory,
  type PenaltyLevel,
  rankOf,
} from "@/discipline-penalties/penalty-kinds";
import { CHARACTER_SCORE_CAP } from "@/discipline-penalties/score-limit";
import { shownDay } from "@/ui/day";
import { ruleOf, socialWorkEnd } from "./penalty-rules";
import { type PeriodOfDay, semesterOnDay } from "./penalty-semester";
import { lengthWords } from "./penalty-words";

/*
 * What "Konsekuensi" says of a penalty before it is saved. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

/** The highest penalty a student has had. */
export interface TopPenalty {
  category: PenaltyCategory;
  level: PenaltyLevel;
  day: string;
}

/** How many penalties a student has had, and the highest. */
export interface PenaltyHistory {
  count: number;
  /** Null for a student with none. */
  top: TopPenalty | null;
}

/** One line of "Konsekuensi": what it is about, and what it says. */
export interface ConsequenceLine {
  title: string;
  text: string;
}

export interface ConsequenceChoice {
  category: PenaltyCategory;
  level: PenaltyLevel;
  /** Mulai kerja sosial as typed; empty while none is. */
  start: string;
  /** Tanggal pelanggaran as typed. */
  day: string;
  /** Angkatan of the student picked; null while none is. */
  cohortYear: number | null;
  periods: readonly PeriodOfDay[];
}

export const NO_HISTORY =
  "Belum ada riwayat pelanggaran. Ini pelanggaran pertama mahasiswa.";

export const LOWER_WARNING =
  "Pilihan saat ini lebih rendah dari hukuman sebelumnya. Periksa kembali sebelum menyimpan.";

const SINCE = "terhitung mulai semester saat pelanggaran dilakukan (ayat 5a).";

function socialWorkLine(choice: ConsequenceChoice): ConsequenceLine | null {
  const length = ruleOf(choice.category, choice.level).socialWork;
  if (length === null) return null;
  const amount = lengthWords(length);
  if (!isDay(choice.start)) return { title: "Kerja sosial", text: amount };
  const end = socialWorkEnd(choice.start, length);
  return {
    title: "Kerja sosial",
    text: `${amount}, ${shownDay(choice.start)} sampai ${shownDay(end)}`,
  };
}

function semesterOf(choice: ConsequenceChoice): number | null {
  if (choice.cohortYear === null || !isDay(choice.day)) return null;
  return semesterOnDay(choice.cohortYear, choice.periods, choice.day);
}

function suspensionLines(semester: number | null): ConsequenceLine[] {
  if (semester === null) {
    return [
      {
        title: "Status",
        text: `Diberhentikan sementara selama 2 semester, ${SINCE}`,
      },
      {
        title: "Akademik",
        text: "Wajib mengulang seluruh mata kuliah semester saat pelanggaran dilakukan (ayat 5b).",
      },
    ];
  }
  return [
    {
      title: "Status",
      text: `Diberhentikan sementara selama semester ${semester} dan ${semester + 1}, ${SINCE}`,
    },
    {
      title: "Akademik",
      text: `Wajib mengulang seluruh mata kuliah semester ${semester} (ayat 5b).`,
    },
  ];
}

function outcomeLines(choice: ConsequenceChoice): ConsequenceLine[] {
  const { outcome } = ruleOf(choice.category, choice.level);
  if (outcome === "capped") {
    return [
      {
        title: "Nilai karakter",
        text: `Dibatasi paling tinggi ${CHARACTER_SCORE_CAP}.`,
      },
    ];
  }
  if (outcome === "suspended") return suspensionLines(semesterOf(choice));
  return [
    {
      title: "Status",
      text: "Status sebagai mahasiswa berakhir secara permanen.",
    },
  ];
}

/**
 * What the chosen Jenjang means for the student: the penalty, the kerja
 * sosial with its dates, and the cap on nilai karakter, the suspension,
 * or the end of the status.
 */
export function consequencesOf(choice: ConsequenceChoice): ConsequenceLine[] {
  const lines: ConsequenceLine[] = [
    { title: "Hukuman", text: ruleOf(choice.category, choice.level).penalty },
  ];
  const work = socialWorkLine(choice);
  if (work !== null) lines.push(work);
  return [...lines, ...outcomeLines(choice)];
}

/** Whether the chosen Jenjang is lower than the highest the student had before. */
export function isLowerThanBefore(
  category: PenaltyCategory,
  level: PenaltyLevel,
  top: TopPenalty | null,
): boolean {
  if (top === null) return false;
  return rankOf(category, level) < rankOf(top.category, top.level);
}

/** The history of the student as "Konsekuensi" says it. */
export function historyWords(history: PenaltyHistory): string {
  const { top } = history;
  if (top === null) return NO_HISTORY;
  return `Riwayat: ${history.count} pelanggaran. Hukuman tertinggi sebelumnya ${kindWords(top)} (${shownDay(top.day)}). Sesuai ayat (6), bila mahasiswa mengulangi perbuatan yang ancamannya lebih tinggi, dikenakan hukuman yang lebih tinggi tersebut.`;
}
