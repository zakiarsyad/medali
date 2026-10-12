import { USUAL_SIZE_WORDS } from "./group-size";
import { PageHead } from "./page-head";
import { TabLinks, type TabLinksProps } from "./tab-links";

/** The head every tab of Pengasuh starts with, and the tabs under it. */
export function MentorsHead({ tabs }: { tabs: TabLinksProps }) {
  return (
    <>
      <PageHead title="Pengasuh">
        Setiap pengasuh membina satu kelompok pengasuhan berisi{" "}
        {USUAL_SIZE_WORDS} mahasiswa. Kelompok dibentuk saat mahasiswa pertama
        kali masuk PKN STAN, tidak mengikuti kelas akademik, dan diasuh pengasuh
        yang sama sampai lulus kecuali ada penggantian.
      </PageHead>
      <TabLinks {...tabs} />
    </>
  );
}
