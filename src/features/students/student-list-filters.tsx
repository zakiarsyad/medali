import {
  GRADE_CHOICE_WORDS,
  GRADE_CHOICES,
} from "@/character-grades/grade-choice";
import { PREDICATES } from "@/character-scores/assessment-score";
import {
  NOT_ASSESSED,
  PREDICATE_WORDS,
} from "@/character-scores/predicate-words";
import shared from "@/ui/data-screen.module.css";
import {
  GRADE_IN_ADDRESS,
  NOT_ASSESSED_CHOICE,
  STATUS_IN_ADDRESS,
  type StatusChoice,
  type StudentListFilters,
} from "./student-list-address";

const STATUS_CHOICES: readonly (readonly [StatusChoice, string])[] = [
  ["current", "Aktif dan cuti"],
  ["all", "Semua status"],
  ["inactive", "Non aktif"],
];

/**
 * The search and the Angkatan, Status, predikat and Nilai karakter
 * choices above the table.
 */
export function StudentListFilterRow({
  filters,
  cohortYears,
}: {
  filters: StudentListFilters;
  /** The years that may be chosen as Angkatan. */
  cohortYears: number[];
}) {
  return (
    <div className={shared.filters}>
      <input
        name="q"
        className={shared.input}
        placeholder="Cari nama atau NIM"
        defaultValue={filters.query}
        aria-label="Cari nama atau NIM"
      />
      <select
        name="angkatan"
        className={shared.input}
        defaultValue={filters.cohortYear ?? ""}
        aria-label="Angkatan"
      >
        <option value="">Semua angkatan</option>
        {cohortYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <select
        name="status"
        className={shared.input}
        defaultValue={STATUS_IN_ADDRESS[filters.status]}
        aria-label="Status"
      >
        {STATUS_CHOICES.map(([status, shown]) => (
          <option key={status} value={STATUS_IN_ADDRESS[status]}>
            {shown}
          </option>
        ))}
      </select>
      <select
        name="predikat"
        className={shared.input}
        defaultValue={filters.predicate ?? ""}
        aria-label="Predikat capaian karakter"
      >
        <option value="">Semua predikat MEDALI</option>
        {PREDICATES.map((predicate) => (
          <option key={predicate} value={predicate}>
            {PREDICATE_WORDS[predicate]}
          </option>
        ))}
        <option value={NOT_ASSESSED_CHOICE}>{NOT_ASSESSED}</option>
      </select>
      <select
        name="nilai"
        className={shared.input}
        defaultValue={filters.grade ? GRADE_IN_ADDRESS[filters.grade] : ""}
        aria-label="Nilai karakter"
      >
        <option value="">Semua nilai karakter</option>
        {GRADE_CHOICES.map((grade) => (
          <option key={grade} value={GRADE_IN_ADDRESS[grade]}>
            {GRADE_CHOICE_WORDS[grade]}
          </option>
        ))}
      </select>
      <button type="submit" className={shared.quiet}>
        Cari
      </button>
    </div>
  );
}
