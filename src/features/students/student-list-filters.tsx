import shared from "@/ui/data-screen.module.css";
import {
  STATUS_IN_ADDRESS,
  type StatusChoice,
  type StudentListFilters,
} from "./student-list-address";

const STATUS_CHOICES: readonly (readonly [StatusChoice, string])[] = [
  ["current", "Aktif dan cuti"],
  ["all", "Semua status"],
  ["inactive", "Non aktif"],
];

/** The search and the Angkatan and Status choices above the table. */
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
      <button type="submit" className={shared.quiet}>
        Cari
      </button>
    </div>
  );
}
