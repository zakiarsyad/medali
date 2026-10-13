import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";

/** The head of the tab "Catatan pendampingan", and the tabs under it. */
export function MentoringHead({ tabs }: { tabs: TabLinksProps }) {
  return (
    <>
      <PageHead title="Pengasuhan">
        Catat setiap pendampingan: konseling, mentoring, apresiasi, atau
        pembinaan. Catatan muncul di profil mahasiswa.
      </PageHead>
      <TabLinks {...tabs} />
    </>
  );
}
