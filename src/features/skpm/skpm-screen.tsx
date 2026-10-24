import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards, WordsCard } from "@/ui/number-cards";
import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead } from "@/ui/tabbed-head";
import {
  SKPM_LIST_PAGE_SIZE,
  type SkpmParams,
  skpmAddress,
} from "./skpm-address";
import type { SkpmList, SkpmNumbers } from "./skpm-board";
import { SkpmFilterRow } from "./skpm-filters";
import { SkpmListTable } from "./skpm-list-table";
import { shownOneDecimal } from "./skpm-words";

function SourceCard({ uploads }: { uploads: number }) {
  if (uploads === 0) {
    return (
      <WordsCard
        label="Sumber data"
        words="Belum ada"
        note="belum ada unggahan"
      />
    );
  }
  return (
    <WordsCard
      label="Sumber data"
      words={`${uploads.toLocaleString("id-ID")} unggahan`}
      note="berkas SKPM"
    />
  );
}

/**
 * Data SKPM: the four numbers, what the account may do with the data or
 * the note for a role that only reads, and "Nilai SKPM per mahasiswa",
 * all of the students the account may see.
 */
export function SkpmScreen({
  tabs,
  params,
  pointsForHundred,
  numbers,
  list,
  manage,
}: {
  tabs: TabLinksProps;
  params: SkpmParams;
  pointsForHundred: number;
  numbers: SkpmNumbers;
  list: SkpmList;
  /** The upload, the conversion and the history, or the read-only note. */
  manage: ReactNode;
}) {
  return (
    <>
      <TabbedHead
        title="Penilaian"
        tabs={tabs}
        lede="Unggah data Sistem Kredit Prestasi Mahasiswa (SKPM). Total poin kegiatan tiap mahasiswa dikonversi menjadi komponen nilai SKPM pada penilaian karakter."
      />
      <NumberCards>
        <NumberCard
          label="Mahasiswa dengan data SKPM"
          amount={numbers.withData}
          note={`dari ${numbers.students.toLocaleString("id-ID")} mahasiswa aktif`}
        />
        <NumberCard
          label="Rerata poin"
          amount={shownOneDecimal(numbers.meanPoints)}
          note="per mahasiswa"
        />
        <NumberCard
          label="Rerata nilai SKPM"
          amount={shownOneDecimal(numbers.meanScore)}
          note={`${pointsForHundred.toLocaleString("id-ID")} poin = nilai 100`}
        />
        <SourceCard uploads={numbers.uploads} />
      </NumberCards>
      {manage}
      <section className={shared.panel}>
        <h2 className={shared.heading}>Nilai SKPM per mahasiswa</h2>
        <SkpmFilterRow params={params} />
        <SkpmListTable rows={list.rows} params={params} />
        {list.matching > 0 && (
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={SKPM_LIST_PAGE_SIZE}
            noun="mahasiswa"
            keepsPlace
            addressOf={(page) => skpmAddress({ ...params, page })}
          />
        )}
      </section>
    </>
  );
}
