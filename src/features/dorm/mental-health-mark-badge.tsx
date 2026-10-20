import type { SickRowMore } from "@/health-notes/sick-table";
import shared from "@/ui/data-screen.module.css";
import styles from "./dorm-health.module.css";
import type { MarkCategory, MentalHealthMark } from "./mental-health-mark-ids";
import { MARK_BADGE_WORDS } from "./mental-health-mark-words";

const MARK_CLASS: Record<MarkCategory, string | undefined> = {
  monitor: styles.markMonitor,
  refer: styles.markRefer,
};

function MarkBadge({ mark }: { mark: MentalHealthMark }) {
  return (
    <span className={`${shared.badge} ${MARK_CLASS[mark.category]}`}>
      {MARK_BADGE_WORDS[mark.category]}
    </span>
  );
}

function Observation({ mark }: { mark: MentalHealthMark }) {
  if (mark.observation === "") return null;
  return (
    <small className={shared.detail}>
      <b>Pengamatan:</b> {mark.observation}
    </small>
  );
}

/**
 * The mark of each row of "Mahasiswa asrama yang sakit": its badge under
 * the category, and "Pengamatan" before the history, as in the
 * prototype. Nothing for a row without a mark.
 */
export function markColumns(
  byStudent: Readonly<Record<string, MentalHealthMark>>,
): SickRowMore {
  return {
    category: (row) => {
      const mark = byStudent[row.id];
      return mark && <MarkBadge mark={mark} />;
    },
    history: (row) => {
      const mark = byStudent[row.id];
      return mark && <Observation mark={mark} />;
    },
  };
}
