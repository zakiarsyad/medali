import type { ReactNode } from "react";
import styles from "./page-head.module.css";

export function Notice({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.lede}>{children}</p>
    </section>
  );
}
