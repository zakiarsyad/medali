import {
  FITNESS_CATEGORIES,
  type FitnessCategory,
} from "@/health-notes/fitness-ids";
import type {
  IllnessCount,
  PhysicalRecap,
  ShownPhysical,
} from "@/health-notes/fitness-recap";
import { ILLNESS_WORDS } from "@/health-notes/health-words";
import { type CountShown, countWords } from "@/health-notes/shown-count";

/** What the card and section 3 say instead of counts for a small group. */
export const PHYSICAL_TOO_FEW =
  "Rekap ditampilkan setelah minimal 5 mahasiswa dites, agar identitas tidak dapat ditebak.";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** The number of the card: the percent prima dan baik, or "-" without one. */
export function physicalCardValue(recap: PhysicalRecap): string {
  if (recap.kind !== "shown" || recap.fitShare === null) return "-";
  return `${recap.fitShare}%`;
}

/** The line of the card "Kesehatan jasmani". */
export function physicalCardLine(recap: PhysicalRecap): string {
  if (recap.kind === "untested") {
    return `Belum ada hasil tes kebugaran dari ${shown(recap.students)} mahasiswa.`;
  }
  if (recap.kind === "too_few") return PHYSICAL_TOO_FEW;
  const { tested, students, byCategory } = recap;
  return `${shown(tested)} dari ${shown(students)} sudah dites. ${countWords(byCategory.medical)} perlu tindak lanjut medis.`;
}

/** What section 3 says while nobody in the group is tested. */
export const NOBODY_TESTED = "Belum ada hasil tes kebugaran.";

/** The line beside "Kategori tes kebugaran". */
export function testedLine(recap: ShownPhysical): string {
  return `${shown(recap.tested)} dari ${shown(recap.students)} sudah dites`;
}

/** The line under the bars: how many have not taken the test. */
export function untestedLine(untested: CountShown): string {
  if (untested === 0) return "Semua mahasiswa sudah mengikuti tes kebugaran.";
  return `${countWords(untested)} mahasiswa belum mengikuti tes kebugaran.`;
}

/** The line that names the most common illnesses of the two lower categories. */
export function illnessLine(illnesses: readonly IllnessCount[]): string {
  const named = illnesses.map(
    ({ illness, students }) =>
      `${ILLNESS_WORDS[illness]} (${countWords(students)})`,
  );
  return `Riwayat penyakit terbanyak pada kategori perlu perhatian dan perlu tindak lanjut medis: ${named.join(", ")}.`;
}

/** One part of the bar of the card, in hundredths of its length. */
export interface StackPart {
  category: FitnessCategory;
  start: number;
  length: number;
}

/**
 * The parts of the bar of the card: each category as its share of the
 * whole group, as the prototype draws it, so those not tested leave the
 * end empty. A category sent as "<5" takes no part.
 */
export function stackParts(
  byCategory: Record<FitnessCategory, CountShown>,
  students: number,
): StackPart[] {
  const parts: StackPart[] = [];
  let start = 0;
  for (const category of FITNESS_CATEGORIES) {
    const count = byCategory[category];
    if (count === "<5" || count === 0) continue;
    const length = (count / students) * 100;
    parts.push({ category, start, length });
    start += length;
  }
  return parts;
}
