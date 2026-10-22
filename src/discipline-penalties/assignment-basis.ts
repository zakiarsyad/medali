import type {
  PenaltyCategory,
  PenaltyLevel,
} from "@/features/guidance/penalty-ids";
import { CATEGORY_WORDS, LEVEL_WORDS } from "@/features/guidance/penalty-words";

/**
 * "Dasar" of a Penugasan sent from a discipline penalty, which Konselor
 * reads: the Kategori and Jenjang only, such as "Pelanggaran disiplin
 * sedang jenjang pertama". Never the Uraian, as Konselor may not read
 * discipline records.
 */
export function assignmentBasis(
  category: PenaltyCategory,
  level: PenaltyLevel,
): string {
  const kategori = CATEGORY_WORDS[category].toLowerCase();
  return `Pelanggaran disiplin ${kategori} jenjang ${LEVEL_WORDS[level]}`;
}
