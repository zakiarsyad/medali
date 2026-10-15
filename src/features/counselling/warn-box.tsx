import type { ReactNode } from "react";
import styles from "./counselling.module.css";

/** A box to read first, such as the emergency notice: its title in bold, then the text. */
export function WarnBox({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.warnBox} role="note">
      <b>{title}</b> {children}
    </div>
  );
}
