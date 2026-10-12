import styles from "./cohort-assignments.module.css";
import { checkWords, type DraftCheck } from "./draft-check";

/**
 * The note that says what the draft still needs before its penetapan: a
 * group without a mentor or without a member, a mentor chosen twice, a
 * student left out of the draft or in a group of another program studi or
 * jalur. A group of an unusual size is named as a warning only.
 */
export function DraftCheckNote({ check }: { check: DraftCheck }) {
  const look = check.isComplete ? styles.note : `${styles.note} ${styles.held}`;
  return (
    <p className={look} role="status">
      {checkWords(check).join(" ")}
    </p>
  );
}
