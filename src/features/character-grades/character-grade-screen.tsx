import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import {
  GRADE_LIST_PAGE_SIZE,
  type GradeParams,
  gradeAddress,
} from "./grade-address";
import { GradeFilterRow } from "./grade-filters";
import type { GradeList } from "./grade-list";
import { GradeListTable } from "./grade-list-table";

/**
 * Penilaian karakter: the head of the tab, the four numbers, "Skema
 * bobot", then "Daftar nilai karakter", of the students the account may
 * see.
 */
export function CharacterGradeScreen({
  tabs,
  numbers,
  scheme,
  params,
  list,
}: {
  tabs: TabLinksProps;
  /** The four numbers above "Skema bobot". */
  numbers: ReactNode;
  /** "Skema bobot", to change or only to read. */
  scheme: ReactNode;
  params: GradeParams;
  list: GradeList;
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
      {numbers}
      {scheme}
      <section className={shared.panel}>
        <h2 className={shared.heading}>Daftar nilai karakter</h2>
        <GradeFilterRow params={params} />
        <GradeListTable rows={list.rows} />
        {list.matching > 0 && (
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={GRADE_LIST_PAGE_SIZE}
            noun="mahasiswa"
            keepsPlace
            addressOf={(page) => gradeAddress({ ...params, page })}
          />
        )}
      </section>
    </>
  );
}
