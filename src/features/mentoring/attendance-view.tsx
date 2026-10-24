import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { toneBadge } from "@/ui/tone-badge";
import { marksOf } from "./attendance-form-values";
import {
  countMarks,
  countWords,
  MARK_TITLES,
  NO_MARK_TITLE,
} from "./attendance-marks";
import type { GroupMember } from "./group-meetings";
import { LIST_ANCHOR } from "./meetings-address";
import type { KeptList } from "./meetings-overview";
import { MemberName } from "./member-name";
import styles from "./mentoring.module.css";

/**
 * "Daftar hadir pertemuan" of a saved meeting for an account that only
 * reads: the day, the topic and the mark of each Aktif member of today,
 * with nothing to change and nothing to send.
 */
export function AttendanceView({
  number,
  members,
  kept,
  closeAddress,
}: {
  number: number;
  /** The Aktif members of the group, by name. */
  members: GroupMember[];
  kept: KeptList;
  /** The address of the tab without the list. */
  closeAddress: string;
}) {
  const { meeting, marks } = kept;
  const memberIds = members.map((member) => member.id);
  const counts = countMarks(marksOf(marks, memberIds));
  return (
    <section id={LIST_ANCHOR} className={shared.panel}>
      <h2 className={shared.heading}>Daftar hadir pertemuan {number}</h2>
      <p className={styles.quiet}>
        {shownDay(meeting.heldOn)} · {meeting.topic}
      </p>
      <ul className={styles.members}>
        {members.map((member) => {
          const mark = marks[member.id];
          return (
            <li key={member.id} className={styles.member}>
              <MemberName member={member} />
              <span className={toneBadge("plain")}>
                {mark === undefined ? NO_MARK_TITLE : MARK_TITLES[mark]}
              </span>
            </li>
          );
        })}
      </ul>
      <div className={shared.actions}>
        <Link href={closeAddress} className={shared.quiet} scroll={false}>
          Tutup
        </Link>
        <span className={styles.quiet}>{countWords(counts, ", ")}</span>
      </div>
    </section>
  );
}
