import styles from "./empty-page.module.css";
import { PageHead } from "./page-head";
import { TabLinks, type TabLinksProps } from "./tab-links";

/**
 * A page that is not built yet: its title, a line under it when there is
 * one, its tabs, and an empty area.
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
      <PageHead title={title}>{lede}</PageHead>
      {tabs && <TabLinks {...tabs} />}
      <section className={styles.empty} aria-label="Isi halaman" />
    </>
  );
}
