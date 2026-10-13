import type { ReactNode } from "react";
import styles from "./number-cards.module.css";

/**
 * One number of a screen: what it counts, the number, and a line under
 * it. A number that is written with more than digits, such as "2 / 4" or
 * "87%", is given as text and shown as it is.
 */
export function NumberCard({
  label,
  amount,
  note,
}: {
  label: string;
  amount: number | string;
  note: string;
}) {
  const shown =
    typeof amount === "number" ? amount.toLocaleString("id-ID") : amount;
  return (
    <div className={styles.number}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{shown}</dd>
      <dd className={styles.note}>{note}</dd>
    </div>
  );
}

/** A fact that stands in the row of numbers and is words, such as a name. */
export function WordsCard({
  label,
  words,
  note,
}: {
  label: string;
  words: string;
  /** A line under the words, when there is one. */
  note?: string;
}) {
  return (
    <div className={styles.number}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.words}>{words}</dd>
      {note !== undefined && <dd className={styles.note}>{note}</dd>}
    </div>
  );
}

/** The row of numbers at the top of a screen. */
export function NumberCards({ children }: { children: ReactNode }) {
  return <dl className={styles.numbers}>{children}</dl>;
}
