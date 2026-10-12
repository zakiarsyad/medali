import {
  type StatusChoice,
  type StudentListFilters,
  topFiltersInUse,
} from "./student-list-address";

const STATUS_WORDS: Record<StatusChoice, string> = {
  current: "mahasiswa aktif dan cuti",
  all: "mahasiswa",
  inactive: "mahasiswa non aktif",
};

/** What the number found is a number of. */
export function foundWords(filters: StudentListFilters): string {
  const inUse = topFiltersInUse(filters);
  if (inUse > 0) return `mahasiswa sesuai ${inUse} filter`;
  return STATUS_WORDS[filters.status];
}
