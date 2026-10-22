import Link from "next/link";
import tabs from "@/ui/tab-links.module.css";
import styles from "./dashboard.module.css";
import { type DashboardKind, KIND_TITLES, kindAddress } from "./dashboard-kind";

/**
 * The switch at the top of the Dashboard of a person who has both views,
 * the open one marked. Nothing shows for an account with one view.
 */
export function DashboardSwitch({
  kinds,
  open,
}: {
  kinds: readonly DashboardKind[];
  open: DashboardKind;
}) {
  if (kinds.length < 2) return null;
  return (
    <nav className={styles.switch} aria-label="Pilih dashboard">
      {kinds.map((kind) => (
        <Link
          key={kind}
          href={kindAddress(kind)}
          className={tabs.tab}
          aria-current={kind === open ? "page" : undefined}
        >
          {KIND_TITLES[kind]}
        </Link>
      ))}
    </nav>
  );
}
