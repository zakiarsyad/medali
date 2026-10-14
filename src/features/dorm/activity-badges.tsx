import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import type { Organiser } from "./activity-ids";
import { type ActivityState, STATE_WORDS } from "./activity-state";
import { ORGANISER_WORDS } from "./activity-words";

const STATE_STYLES: Record<ActivityState, string | undefined> = {
  coming: styles.plain,
  today_not_started: styles.warn,
  running: styles.ok,
  over: styles.plain,
};

/** Where an activity stands, in the look of how far it is. */
export function StateBadge({ state }: { state: ActivityState }) {
  return (
    <span className={`${shared.badge} ${STATE_STYLES[state]}`}>
      {STATE_WORDS[state]}
    </span>
  );
}

/** BAM keeps the gold of a plain badge, as in the prototype. */
const ORGANISER_STYLES: Record<Organiser, string | undefined> = {
  upk: styles.ok,
  coach: styles.warn,
  bam: undefined,
};

/** The penanggung jawab, by its short name. */
export function OrganiserBadge({ organiser }: { organiser: Organiser }) {
  return (
    <span className={`${shared.badge} ${ORGANISER_STYLES[organiser] ?? ""}`}>
      {ORGANISER_WORDS[organiser]}
    </span>
  );
}

/** Rutin or Non rutin. */
export function KindBadge({ isRoutine }: { isRoutine: boolean }) {
  if (!isRoutine) return <span className={shared.badge}>Non rutin</span>;
  return <span className={`${shared.badge} ${styles.plain}`}>Rutin</span>;
}
