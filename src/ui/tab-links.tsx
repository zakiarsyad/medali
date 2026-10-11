import Link from "next/link";
import styles from "./tab-links.module.css";

export interface TabLinksProps {
  pagePath: string;
  tabs: { path: string; title: string }[];
  /** The path of the tab that is open. */
  open: string;
}

export function TabLinks({ pagePath, tabs, open }: TabLinksProps) {
  return (
    <nav className={styles.tabs} aria-label="Bagian halaman">
      {tabs.map((tab) => (
        <Link
          key={tab.path}
          href={`/${pagePath}/${tab.path}`}
          className={styles.tab}
          aria-current={tab.path === open ? "page" : undefined}
        >
          {tab.title}
        </Link>
      ))}
    </nav>
  );
}
