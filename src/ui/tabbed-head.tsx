import type { ReactNode } from "react";
import { PageHead } from "./page-head";
import { showsTabBar, TabLinks, type TabLinksProps } from "./tab-links";
import styles from "./tabbed-head.module.css";

/**
 * The head of a page with tabs: the page's title, the tab bar, then the
 * open tab's description and its notes. Nothing above the tab bar depends
 * on the open tab, so the bar stays in place when another tab opens. A
 * role with one tab has no bar, and its description stays under the title.
 */
export function TabbedHead({
  title,
  tabs,
  lede,
  children,
}: {
  title: string;
  tabs: TabLinksProps;
  /** The open tab's description, if it has one. */
  lede?: ReactNode;
  /** The open tab's notes, each a `TabNote`. */
  children?: ReactNode;
}) {
  const notes = <div className={styles.notes}>{children}</div>;
  if (!showsTabBar(tabs.tabs)) {
    return (
      <>
        <PageHead title={title}>{lede}</PageHead>
        {notes}
      </>
    );
  }
  return (
    <>
      <PageHead title={title} />
      <TabLinks {...tabs} />
      {lede && <p className={styles.lede}>{lede}</p>}
      {notes}
    </>
  );
}

/** A note of the open tab, such as who manages it, under its description. */
export function TabNote({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}
