import Link from "next/link";
import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./dashboard.module.css";

/**
 * The head of a numbered section: its number, its title, which its card
 * moves the page to, the line under it, and "Lihat rincian" to the tab
 * behind it, for an account that may open that tab.
 */
export function SectionHead({
  number,
  id,
  title,
  detailAddress,
  children,
}: {
  number: number;
  id: string;
  title: string;
  detailAddress: string | null;
  /** The line under the title. */
  children: ReactNode;
}) {
  return (
    <div className={styles.sectionHead}>
      <span className={styles.sectionNoBig}>{number}</span>
      <div>
        <h2 id={id} className={styles.sectionTitle}>
          {title}
        </h2>
        <p className={styles.sectionLine}>{children}</p>
      </div>
      {detailAddress !== null && (
        <Link href={detailAddress} className={shared.quiet}>
          Lihat rincian
        </Link>
      )}
    </div>
  );
}
