import styles from "./cohort-assignments.module.css";
import { checkWords, type DraftCheck, isReadyToFix } from "./draft-check";

/**
 * The note that says what the draft still needs before its penetapan: a
 * group without a mentor or without a member, a mentor chosen twice, a
 * student left out of the draft or in a group of another program studi or
 * jalur, or a mentor who can no longer be chosen. A group of an unusual
 * size is named as a warning only.
 */
export function DraftCheckNote({
  check,
  notOffered,
}: {
  check: DraftCheck;
  /** How many groups have a mentor who can no longer be chosen. */
  notOffered: number;
}) {
  const look = isReadyToFix(check, notOffered)
    ? styles.note
    : `${styles.note} ${styles.held}`;
  return (
    <p className={look} role="status">
      {checkWords(check, notOffered).join(" ")}
    </p>
  );
}
