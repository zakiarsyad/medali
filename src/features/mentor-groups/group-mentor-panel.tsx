import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { mentorLabel } from "@/ui/mentor-label";
import type { GroupMentorLine } from "./group-detail";
import styles from "./mentor-groups.module.css";
import { currentMentor, mentorLineWords } from "./mentor-history";

const BETWEEN = " · ";

/** The unit when one is kept, then since when the mentor holds the group. */
function unitAndSince(mentor: GroupMentorLine): string {
  const since = `mengasuh sejak ${shownDay(mentor.startsOn)}`;
  return mentor.unit ? `${mentor.unit}${BETWEEN}${since}` : since;
}

function CurrentMentor({ mentor }: { mentor: GroupMentorLine | null }) {
  if (mentor === null) {
    return (
      <p className={styles.quiet}>Kelompok ini belum memiliki pengasuh.</p>
    );
  }
  return (
    <p>
      <b className={styles.mentor}>{mentorLabel(mentor)}</b>
      <small className={shared.detail}>{unitAndSince(mentor)}</small>
    </p>
  );
}

function HistoryLine({ line }: { line: GroupMentorLine }) {
  return (
    <li>
      <b>{line.name}</b>{" "}
      {line.endsOn === null && <span className={shared.badge}>Saat ini</span>}
      <small className={shared.detail}>{mentorLineWords(line)}</small>
    </li>
  );
}

/**
 * The mentor of today, how many notes were written about the members
 * lately, and every mentor the group has had, newest first.
 */
export function GroupMentorPanel({
  mentors,
  recentNotes,
}: {
  mentors: GroupMentorLine[];
  /** How many mentoring notes of the last 90 days there are about the members. */
  recentNotes: number;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Pengasuh saat ini</h2>
      <CurrentMentor mentor={currentMentor(mentors)} />
      <p className={styles.facts}>
        Catatan pengasuhan 90 hari: <b>{recentNotes.toLocaleString("id-ID")}</b>
      </p>
      <h3 className={styles.subheading}>Riwayat pengasuh kelompok</h3>
      {mentors.length === 0 ? (
        <p className={styles.quiet}>Belum ada riwayat pengasuh.</p>
      ) : (
        <ul className={styles.history}>
          {mentors.map((line) => (
            <HistoryLine key={line.id} line={line} />
          ))}
        </ul>
      )}
    </section>
  );
}
