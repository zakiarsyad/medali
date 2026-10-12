import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
import { groupAddress } from "./group-list-address";
import type { MentorAssignment } from "./mentor-detail";
import styles from "./mentor-groups.module.css";
import { mentorLineWords } from "./mentor-history";

function AssignmentLine({ line }: { line: MentorAssignment }) {
  return (
    <li>
      <Link href={groupAddress(line.groupId)} className={shared.link}>
        {groupCode(line)}
      </Link>{" "}
      {line.endsOn === null && <span className={shared.badge}>Saat ini</span>}
      <small className={shared.detail}>{mentorLineWords(line)}</small>
    </li>
  );
}

/** Every time the mentor held a group, the newest first. */
export function MentorAssignmentsPanel({
  assignments,
}: {
  assignments: MentorAssignment[];
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Riwayat penugasan</h2>
      {assignments.length === 0 ? (
        <p className={styles.quiet}>Belum pernah memegang kelompok.</p>
      ) : (
        <ul className={styles.history}>
          {assignments.map((line) => (
            <AssignmentLine key={line.id} line={line} />
          ))}
        </ul>
      )}
    </section>
  );
}
