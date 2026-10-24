import Link from "next/link";
import styles from "./tab-links.module.css";

export interface TabLinksProps {
  pagePath: string;
  tabs: { path: string; title: string }[];
  /** The path of the tab that is open. */
  open: string;
}

/** Whether the role has a choice of tabs, so the tab bar is drawn. */
export function showsTabBar(tabs: TabLinksProps["tabs"]): boolean {
  return tabs.length > 1;
}

export function TabLinks({ pagePath, tabs, open }: TabLinksProps) {
  if (!showsTabBar(tabs)) return null;

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
