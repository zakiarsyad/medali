import shared from "@/ui/data-screen.module.css";
import styles from "./skpm.module.css";
import { readOnlyNote } from "./skpm-words";

/** What a role that only reads the tab is told: who uploads, and the conversion. */
export function ReadOnlyNote({
  pointsForHundred,
}: {
  pointsForHundred: number;
}) {
  return (
    <section className={shared.panel}>
      <p className={styles.note}>{readOnlyNote(pointsForHundred)}</p>
    </section>
  );
}
