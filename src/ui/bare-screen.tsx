import type { ReactNode } from "react";
import styles from "./bare-screen.module.css";

/** A screen without the menu: one box in the middle of the window. */
export function BareScreen({ children }: { children: ReactNode }) {
  return (
    <main className={styles.screen}>
      <div className={styles.box}>{children}</div>
    </main>
  );
}
