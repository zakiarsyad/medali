import styles from "./cohort-assignments.module.css";
import { checkDraft, checkWords } from "./draft-check";
import type { DraftGroup } from "./stored-assignment";

/** The check of the groups of a draft as they are saved. */
export function checkOfGroups(groups: DraftGroup[]) {
  return checkDraft(
    groups.map((group) => ({
      mentorId: group.mentor?.id ?? null,
      members: group.members.length,
    })),
  );
}

/**
 * The note that says what the draft still needs before its penetapan: a
 * group without a mentor, a mentor chosen twice. A group of an unusual
 * size is named as a warning only.
 */
export function DraftCheckNote({ groups }: { groups: DraftGroup[] }) {
  const check = checkOfGroups(groups);
  const look = check.isComplete ? styles.note : `${styles.note} ${styles.held}`;
  return (
    <p className={look} role="status">
      {checkWords(check).join(" ")}
    </p>
  );
}
