import type { ReactNode } from "react";
import styles from "./number-cards.module.css";

/** One number of a screen: what it counts, the number, and a line under it. */
export function NumberCard({
  label,
  amount,
  note,
}: {
  label: string;
  amount: number;
  note: string;
}) {
  return (
    <div className={styles.number}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{amount.toLocaleString("id-ID")}</dd>
      <dd className={styles.note}>{note}</dd>
    </div>
  );
}

/** The row of numbers at the top of a screen. */
export function NumberCards({ children }: { children: ReactNode }) {
  return <dl className={styles.numbers}>{children}</dl>;
}
