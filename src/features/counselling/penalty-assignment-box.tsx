import styles from "./counselling.module.css";
import {
  BOX_TITLE,
  SESSION_PRIVATE,
  sentWords,
} from "./penalty-assignment-words";
import type { PenaltyAssignment } from "./penalty-assignments";
import { ScheduleBadge } from "./schedule-card-parts";
import { timeWords } from "./schedule-words";

/**
 * How a Penugasan sent from a penalty stands, for its sender: the
 * status, the date and Jam once Konselor set them, and when and by whom
 * it was sent. Nothing else of Konseling shows here.
 */
export function PenaltyAssignmentBox({
  assignment,
}: {
  assignment: PenaltyAssignment;
}) {
  const { status, day, hour, sentAt, sentBy } = assignment;
  return (
    <>
      <p className={styles.status}>
        <b>{BOX_TITLE}:</b>
        <ScheduleBadge status={status} />
        {day !== null && hour !== null && <span>{timeWords(day, hour)}</span>}
      </p>
      <p className={styles.sub}>
        {sentWords(sentAt, sentBy)} {SESSION_PRIVATE}
      </p>
    </>
  );
}
