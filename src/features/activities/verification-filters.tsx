import shared from "@/ui/data-screen.module.css";
import styles from "./verification.module.css";
import {
  STATUS_CHOICE_WORDS,
  STATUS_CHOICES,
  STATUS_ORDER,
  type VerificationFilters,
} from "./verification-address";
import type { ScheduleChoice } from "./verification-choices";

/** The choices of activity and of status above the photo cards. */
export function VerificationFilterRow({
  filters,
  choices,
}: {
  filters: VerificationFilters;
  choices: ScheduleChoice[];
}) {
  return (
    <div className={`${shared.filters} ${styles.filters}`}>
      <select
        name="kegiatan"
        className={shared.input}
        defaultValue={filters.scheduleId ?? ""}
        aria-label="Kegiatan"
      >
        <option value="">Semua kegiatan</option>
        {choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {choice.words}
          </option>
        ))}
      </select>
      <select
        name="status"
        className={shared.input}
        defaultValue={STATUS_CHOICES[filters.status]}
        aria-label="Status"
      >
        {STATUS_ORDER.map((status) => (
          <option key={status} value={STATUS_CHOICES[status]}>
            {STATUS_CHOICE_WORDS[status]}
          </option>
        ))}
      </select>
    </div>
  );
}
