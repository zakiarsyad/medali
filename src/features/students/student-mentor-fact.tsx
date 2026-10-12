import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { mentorGroupWords, mentorWords } from "./mentor-group-words";
import styles from "./student-list.module.css";
import type {
  GroupAddressOf,
  StudentMentorGroup,
} from "./student-mentor-group";

/** The mentor's name, as a link to the group's page when there is one to open. */
function MentorName({
  group,
  groupAddressOf,
}: {
  group: StudentMentorGroup | null;
  groupAddressOf: GroupAddressOf;
}) {
  const name = mentorWords(group);
  if (group === null || group.mentor === null) return name;
  const address = groupAddressOf(group);
  if (address === null) return name;
  return (
    <Link href={address} className={shared.link}>
      {name}
    </Link>
  );
}

/** Who looks after the student, and in which kelompok pengasuhan. */
export function StudentMentorFact({
  group,
  groupAddressOf,
}: {
  group: StudentMentorGroup | null;
  groupAddressOf: GroupAddressOf;
}) {
  return (
    <div className={styles.wideFact}>
      <dt>Pengasuh</dt>
      <dd>
        <MentorName group={group} groupAddressOf={groupAddressOf} />
        {group && (
          <small className={shared.detail}>{mentorGroupWords(group)}</small>
        )}
      </dd>
    </div>
  );
}
