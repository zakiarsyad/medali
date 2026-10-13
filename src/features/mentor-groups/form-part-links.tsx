import Link from "next/link";
import { type FormPart, formAddress } from "./evaluation-address";
import styles from "./mentor-groups.module.css";

/** What the switch calls each form. */
const PART_WORDS: Record<FormPart, string> = {
  evaluation: "Evaluasi",
  replacement: "Penggantian",
};

/**
 * The switch between the forms of the tab an account may use. It keeps
 * the group that is chosen, so the other form opens for the same group.
 */
export function FormPartLinks({
  offered,
  open,
  chosenGroupId,
}: {
  offered: FormPart[];
  open: FormPart;
  chosenGroupId: string | null;
}) {
  if (offered.length < 2) return null;
  return (
    <nav className={styles.parts} aria-label="Bagian formulir">
      {offered.map((part) => (
        <Link
          key={part}
          href={formAddress(part, chosenGroupId)}
          className={styles.part}
          aria-current={part === open ? "true" : undefined}
          scroll={false}
        >
          {PART_WORDS[part]}
        </Link>
      ))}
    </nav>
  );
}
