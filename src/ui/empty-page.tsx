import styles from "./empty-page.module.css";
import { PageHead } from "./page-head";
import type { TabLinksProps } from "./tab-links";
import { TabbedHead } from "./tabbed-head";

/**
 * A page that is not built yet: its title, its tabs, a line under them
 * when there is one, and an empty area.
 */
export function EmptyPage({
  title,
  lede,
  tabs,
}: {
  title: string;
  lede?: string | null;
  tabs?: TabLinksProps;
}) {
  return (
    <>
      {tabs ? (
        <TabbedHead title={title} tabs={tabs} lede={lede} />
      ) : (
        <PageHead title={title}>{lede}</PageHead>
      )}
      <section className={styles.empty} aria-label="Isi halaman" />
    </>
  );
}
