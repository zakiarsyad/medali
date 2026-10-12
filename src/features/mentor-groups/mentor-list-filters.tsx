import shared from "@/ui/data-screen.module.css";
import { MENTOR_STATUS_TITLES, MENTOR_STATUSES } from "@/ui/mentor-status";
import styles from "./mentor-groups.module.css";
import {
  type MentorListFilters,
  STATUS_IN_ADDRESS,
} from "./mentor-list-address";

const SEARCH_WORDS = "Cari nama pengasuh";

/** The search and the Status and Unit choices above the list. */
export function MentorListFilterRow({
  filters,
  units,
}: {
  filters: MentorListFilters;
  /** The units the Unit choice offers. */
  units: string[];
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
        name="status"
        className={shared.input}
        defaultValue={filters.status ? STATUS_IN_ADDRESS[filters.status] : ""}
        aria-label="Status"
      >
        <option value="">Semua status</option>
        {MENTOR_STATUSES.map((status) => (
          <option key={status} value={STATUS_IN_ADDRESS[status]}>
            {MENTOR_STATUS_TITLES[status]}
          </option>
        ))}
      </select>
      <select
        name="unit"
        className={`${shared.input} ${styles.fit}`}
        defaultValue={filters.unit ?? ""}
        aria-label="Unit"
      >
        <option value="">Semua unit</option>
        {units.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
      <button type="submit" className={shared.quiet}>
        Cari
      </button>
    </div>
  );
}
