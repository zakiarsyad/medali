import {
  FITNESS_CATEGORIES,
  type FitnessCategory,
} from "@/health-notes/fitness-ids";
import { type CountShown, countWords } from "@/health-notes/shown-count";
import type { PhysicalRecap } from "./physical-recap";

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
