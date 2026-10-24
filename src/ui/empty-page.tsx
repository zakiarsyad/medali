import type { ReactNode } from "react";
import styles from "./empty-page.module.css";
import { PageHead } from "./page-head";
import type { TabLinksProps } from "./tab-links";
import { TabbedHead } from "./tabbed-head";

/**
 * A page that is not built yet: its title, its tabs, what its content
 * starts with when there is something, and an empty area.
 */
export function EmptyPage({
  title,
  tabs,
  children,
}: {
  title: string;
  tabs?: TabLinksProps;
  /** What the content starts with, such as where a resident lives. */
  children?: ReactNode;
}) {
  return (
    <>
      {tabs ? (
        <TabbedHead title={title} tabs={tabs} />
      ) : (
        <PageHead title={title} />
      )}
      {children}
      <section className={styles.empty} aria-label="Isi halaman" />
    </>
  );
}
