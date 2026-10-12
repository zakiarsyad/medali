import { shownDay } from "@/ui/day";

/** What "Tetapkan" is about to do, in numbers. */
export interface FixSize {
  cohortYear: number;
  groups: number;
  students: number;
}

/** What "Tetapkan" asks before the groups take effect. */
export function fixQuestion(size: FixSize, effectiveOn: string): string {
  const students = size.students.toLocaleString("id-ID");
  return `Tetapkan ${size.groups} kelompok pengasuhan angkatan ${size.cohortYear}? Seluruh ${students} mahasiswa masuk ke kelompok dan pengasuhnya mulai ${shownDay(effectiveOn)}.`;
}

/** What stands under the heading of a fixed angkatan. */
export function fixedWords(fixed: {
  decreeNumber: string | null;
  effectiveOn: string | null;
  savedBy: string;
}): string {
  const words = [fixed.decreeNumber ?? "-"];
  if (fixed.effectiveOn !== null) {
    words.push(`berlaku ${shownDay(fixed.effectiveOn)}`);
  }
  words.push(`ditetapkan ${fixed.savedBy}`);
  return words.join(" · ");
}
