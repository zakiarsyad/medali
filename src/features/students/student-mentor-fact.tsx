import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
import {
  afterGroupCode,
  BEFORE_GROUP_CODE,
  mentorGroupWords,
  mentorWords,
} from "./mentor-group-words";
import styles from "./student-list.module.css";
import type { ShownMentorGroup } from "./student-mentor-group";

/** The mentor's name, as a link to the mentor's page when there is one to open. */
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

/** The line under the mentor, with the group's code as a link to the group's page when there is one to open. */
function GroupWords({
  group,
  address,
}: {
  group: ShownMentorGroup;
  address: string | null;
}) {
  if (address === null) return mentorGroupWords(group);
  return (
    <>
      {BEFORE_GROUP_CODE}
      <Link href={address} className={`${shared.link} ${shared.inline}`}>
        {groupCode(group)}
      </Link>
      {afterGroupCode(group)}
    </>
  );
}

/** Who looks after the student, and in which kelompok pengasuhan. */
export function StudentMentorFact({
  group,
  mentorAddress = null,
  groupAddress = null,
}: {
  group: ShownMentorGroup | null;
  /**
   * The address of the mentor's page. Without one the mentor is named as
   * plain text: the reader may not open that page.
   */
  mentorAddress?: string | null;
  /**
   * The address of the group's page. Without one the group's code is plain
   * text: the reader may not open that page.
   */
  groupAddress?: string | null;
}) {
  return (
    <div className={styles.wideFact}>
      <dt>Pengasuh</dt>
      <dd>
        <MentorName group={group} address={mentorAddress} />
        {group && (
          <small className={shared.detail}>
            <GroupWords group={group} address={groupAddress} />
          </small>
        )}
      </dd>
    </div>
  );
}
