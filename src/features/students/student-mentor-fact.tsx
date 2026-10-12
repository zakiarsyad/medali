import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { mentorGroupWords, mentorWords } from "./mentor-group-words";
import styles from "./student-list.module.css";
import type { ShownMentorGroup } from "./student-mentor-group";

/** The mentor's name, as a link to the group's page when there is one to open. */
function MentorName({
  group,
  address,
}: {
  group: ShownMentorGroup | null;
  address: string | null;
}) {
  const name = mentorWords(group);
  if (group === null || group.mentor === null) return name;
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
  address = null,
}: {
  group: ShownMentorGroup | null;
  /**
   * The address of the group's page. Without one the mentor is named as
   * plain text: the reader may not open that page.
   */
  address?: string | null;
}) {
  return (
    <div className={styles.wideFact}>
      <dt>Pengasuh</dt>
      <dd>
        <MentorName group={group} address={address} />
        {group && (
          <small className={shared.detail}>{mentorGroupWords(group)}</small>
        )}
      </dd>
    </div>
  );
}
