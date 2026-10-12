import shared from "@/ui/data-screen.module.css";
import type { GroupChoices } from "./group-choices";
import type { GroupListFilters } from "./group-list-address";

const SEARCH_WORDS = "Cari kode kelompok atau nama pengasuh";

/** The search and the Program studi and Angkatan choices above the list. */
export function GroupListFilterRow({
  filters,
  choices,
}: {
  filters: GroupListFilters;
  choices: GroupChoices;
}) {
  return (
    <div className={shared.filters}>
      <input
        name="q"
        className={shared.input}
        placeholder={SEARCH_WORDS}
        defaultValue={filters.query}
        aria-label={SEARCH_WORDS}
      />
      <select
        name="prodi"
        className={shared.input}
        defaultValue={filters.studyProgramId ?? ""}
        aria-label="Program studi"
      >
        <option value="">Semua prodi</option>
        {choices.programs.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name}
          </option>
        ))}
      </select>
      <select
        name="angkatan"
        className={shared.input}
        defaultValue={filters.cohortYear ?? ""}
        aria-label="Angkatan"
      >
        <option value="">Semua angkatan</option>
        {choices.cohortYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <button type="submit" className={shared.quiet}>
        Cari
      </button>
    </div>
  );
}
