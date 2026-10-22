import styles from "./limit-note.module.css";

/** A note saying why a student's scores are held lower than stored. */
export function LimitNote({ text }: { text: string }) {
  return <p className={styles.note}>{text}</p>;
}
