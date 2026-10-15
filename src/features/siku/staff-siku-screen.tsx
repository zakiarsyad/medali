import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import styles from "./siku.module.css";
import {
  SIKU_LIST_PAGE_SIZE,
  type SikuParams,
  sikuAddress,
} from "./siku-address";
import type { SikuList, SikuNumbers, SikuRanking } from "./siku-board";
import { SikuFilterRow } from "./siku-filters";
import { SikuInputTitle } from "./siku-input-title";
import { SikuListTable } from "./siku-list-table";
import { SikuRankingPanels } from "./siku-ranking";
import { shownMean } from "./siku-words";

export const READ_ONLY_INPUT =
  "Nilai SIKU diinput oleh Penilai Mahasiswa. Anda dapat melihat hasilnya di daftar di bawah.";

/**
 * Penilaian SIKU for staff: the four numbers, the requests of students,
 * "Input nilai SIKU" with the form for those who may enter and a note for
 * those who only read, the ranking, the history, and "Daftar nilai SIKU",
 * all of the students the account may see.
 */
export function StaffSikuScreen({
  tabs,
  params,
  base,
  numbers,
  ranking,
  list,
  requests,
  form,
  history,
}: {
  tabs: TabLinksProps;
  params: SikuParams;
  base: number;
  numbers: SikuNumbers;
  ranking: SikuRanking;
  list: SikuList;
  /** "Pengajuan penambahan SIKU dari mahasiswa". */
  requests: ReactNode;
  /** "Input nilai SIKU" with its title, or null for an account that only reads. */
  form: ReactNode;
  history: ReactNode;
}) {
  return (
    <>
      <PageHead title="Penilaian SIKU">
        Penilaian sikap dan perilaku (SIKU): setiap mahasiswa mulai dari nilai
        dasar yang sama, lalu mendapat penambahan atau pengurangan beralasan.
      </PageHead>
      <TabLinks {...tabs} />
      <NumberCards>
        <NumberCard
          label="Nilai dasar SIKU"
          amount={base}
          note="diatur di menu Kurikulum"
        />
        <NumberCard
          label="Rerata SIKU akhir"
          amount={shownMean(numbers.mean)}
          note={`${numbers.students.toLocaleString("id-ID")} mahasiswa aktif`}
        />
        <NumberCard
          label="Mendapat penambahan"
          amount={numbers.gained}
          note="mahasiswa"
        />
        <NumberCard
          label="Mendapat pengurangan"
          amount={numbers.lost}
          note="mahasiswa"
        />
      </NumberCards>
      {requests}
      <section className={shared.panel}>
        {form ?? (
          <>
            <SikuInputTitle base={base} />
            <p className={styles.note}>{READ_ONLY_INPUT}</p>
          </>
        )}
      </section>
      <SikuRankingPanels ranking={ranking} params={params} base={base} />
      {history}
      <section className={shared.panel}>
        <h2 className={shared.heading}>Daftar nilai SIKU</h2>
        <SikuFilterRow params={params} />
        <SikuListTable rows={list.rows} base={base} params={params} />
        {list.matching > 0 && (
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={SIKU_LIST_PAGE_SIZE}
            noun="mahasiswa"
            keepsPlace
            addressOf={(page) => sikuAddress({ ...params, page })}
          />
        )}
      </section>
    </>
  );
}
