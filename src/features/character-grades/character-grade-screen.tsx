import type { ReactNode } from "react";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";

/** Penilaian karakter: the head of the tab, then "Skema bobot". */
export function CharacterGradeScreen({
  tabs,
  scheme,
}: {
  tabs: TabLinksProps;
  /** "Skema bobot", to change or only to read. */
  scheme: ReactNode;
}) {
  return (
    <>
      <PageHead title="Penilaian karakter">
        Nilai karakter semester berdasarkan Keputusan Direktur Nomor KEP-220
        tentang Pedoman Penilaian Karakter Mahasiswa: kehadiran kegiatan, nilai
        pengasuhan, nilai sikap dan perilaku (SIKU), serta nilai SKPM,
        masing-masing dengan bobotnya.
      </PageHead>
      <TabLinks {...tabs} />
      {scheme}
    </>
  );
}
