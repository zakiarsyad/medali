import Link from "next/link";
import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { toneBadge } from "@/ui/tone-badge";
import styles from "./tasks.module.css";

function WaitingBadge({ total }: { total: number }) {
  if (total === 0) {
    return <span className={toneBadge("good")}>Beres</span>;
  }
  return <span className={toneBadge("warning")}>{total} menunggu</span>;
}

/**
 * One section of Tugas saya: its title and what it is for, "(n)
 * menunggu" or "Beres", and `children`, its items. When more wait than
 * it shows, it leads to all of them.
 */
export function TaskSection({
  id,
  title,
  purpose,
  total,
  shown,
  all,
  children,
}: {
  /** Where its number card jumps to. */
  id: string;
  title: string;
  purpose: string;
  /** How many wait in all. */
  total: number;
  /** How many of them it shows. */
  shown: number;
  /** The tab where every item that waits is listed, and its name. */
  all: { address: string; tab: string };
  children: ReactNode;
}) {
  return (
    <section id={id} className={shared.panel} aria-labelledby={`${id}-title`}>
      <div className={styles.sectionHead}>
        <div>
          <h2 id={`${id}-title`} className={shared.heading}>
            {title}
          </h2>
          <p className={styles.purpose}>{purpose}</p>
        </div>
        <WaitingBadge total={total} />
      </div>
      {children}
      {total > shown && (
        <p className={styles.more}>
          <Link href={all.address}>{`Lihat semua di ${all.tab}`}</Link>
        </p>
      )}
    </section>
  );
}
