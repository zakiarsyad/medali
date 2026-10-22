import type { ReactNode } from "react";
import styles from "./dashboard.module.css";

/**
 * An aspect card: a link that moves the page to its section, or a plain
 * box where the page has no such section.
 */
export function CardBox({
  target,
  children,
}: {
  /** The id of the section it leads to, or null for none. */
  target: string | null;
  children: ReactNode;
}) {
  if (target === null) return <div className={styles.card}>{children}</div>;
  return (
    <a className={styles.card} href={`#${target}`}>
      {children}
    </a>
  );
}
