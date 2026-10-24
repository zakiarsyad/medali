import Link from "next/link";
import styles from "./dashboard.module.css";
import {
  type MentoringProgress,
  NO_RUNNING_PERIOD,
  progressComplete,
  progressLine,
} from "./mentee-progress";

/** Where the two links of the box lead, or null for a tab the account may not open. */
export interface ProgressLinks {
  meetings: string | null;
  scores: string | null;
}

function BoxLinks({ links }: { links: ProgressLinks }) {
  return (
    <>
      {links.meetings !== null && (
        <Link href={links.meetings}>Isi daftar hadir</Link>
      )}
      {links.meetings !== null && links.scores !== null && " · "}
      {links.scores !== null && (
        <Link href={links.scores}>Isi nilai pengasuhan</Link>
      )}
    </>
  );
}

/**
 * What the Pengasuh has filled in this semester, with the links to fill
 * in the rest. Marked as a warning until every meeting is filled in and
 * every anak asuh is scored.
 */
export function MenteeProgressBox({
  progress,
  links,
}: {
  progress: MentoringProgress | null;
  links: ProgressLinks;
}) {
  if (progress === null) {
    return <p className={styles.progress}>{NO_RUNNING_PERIOD}</p>;
  }
  const done = progressComplete(progress);
  return (
    <p className={done ? styles.progress : styles.progressWarn}>
      {progressLine(progress)} <BoxLinks links={links} />
    </p>
  );
}
