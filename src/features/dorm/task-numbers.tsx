import styles from "./tasks.module.css";

/** One number card of Tugas saya: what it counts, and the section it jumps to. */
export interface TaskNumber {
  label: string;
  amount: number;
  sectionId: string;
}

/**
 * The number cards at the top of Tugas saya, one per section. A card
 * with something waiting stands out; pressing a card jumps to its
 * section. They fold onto more rows as the screen narrows.
 */
export function TaskNumbers({ numbers }: { numbers: TaskNumber[] }) {
  return (
    <ul className={styles.numbers}>
      {numbers.map((number) => (
        <li key={number.sectionId}>
          <a
            href={`#${number.sectionId}`}
            className={number.amount > 0 ? styles.numberOn : styles.number}
          >
            <span className={styles.amount}>
              {number.amount.toLocaleString("id-ID")}
            </span>
            <span>{number.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
