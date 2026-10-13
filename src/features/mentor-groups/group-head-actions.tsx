import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import styles from "./mentor-groups.module.css";

/**
 * The buttons under the head of the page of a group that has a mentor:
 * "Evaluasi pengasuh" and "Ganti pengasuh", each only with its address.
 * An account that has neither gets nothing.
 */
export function GroupHeadActions({
  evaluateAddress,
  replaceAddress,
}: {
  /** The form that evaluates the mentor, or null for no button. */
  evaluateAddress: string | null;
  /** The form that replaces the mentor, or null for no button. */
  replaceAddress: string | null;
}) {
  if (evaluateAddress === null && replaceAddress === null) return null;
  return (
    <p className={styles.headActions}>
      {evaluateAddress !== null && (
        <Link href={evaluateAddress} className={shared.quiet}>
          Evaluasi pengasuh
        </Link>
      )}
      {replaceAddress !== null && (
        <Link href={replaceAddress} className={shared.button}>
          Ganti pengasuh
        </Link>
      )}
    </p>
  );
}
