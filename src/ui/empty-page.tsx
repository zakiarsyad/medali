import styles from "./empty-page.module.css";
import { PageHead } from "./page-head";
import { TabLinks, type TabLinksProps } from "./tab-links";

/** A page that is not built yet: its title, its tabs, and an empty area. */
export function EmptyPage({
  title,
  tabs,
}: {
  title: string;
  tabs?: TabLinksProps;
}) {
  return (
    <>
      <PageHead title={title} />
      {tabs && <TabLinks {...tabs} />}
      <section className={styles.empty} aria-label="Isi halaman" />
    </>
  );
}
