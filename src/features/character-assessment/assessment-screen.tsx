import type { ReactNode } from "react";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead } from "@/ui/tabbed-head";
import {
  ASSESSMENT_LIST_PAGE_SIZE,
  type AssessmentParams,
  assessmentAddress,
} from "./assessment-address";
import type { AssessmentList } from "./assessment-board";
import type { AssessmentNumbers } from "./assessment-counts";
import { AssessmentFilterRow } from "./assessment-filters";
import { AssessmentListTable } from "./assessment-list-table";
import { READ_ONLY_NOTE, shownShare } from "./assessment-words";
import styles from "./character-assessment.module.css";

/** What a role that only reads the tab is told: who enters the assessments. */
export function ReadOnlyNote() {
  return (
    <section className={shared.panel}>
      <p className={styles.note}>{READ_ONLY_NOTE}</p>
    </section>
  );
}

function thisPeriodNote(periodName: string | null): string {
  if (periodName === null) return "belum ada periode akademik berjalan";
  return `asesmen terakhir pada ${periodName}`;
}

/**
 * Asesmen karakter: the four numbers, the form for those who may enter
 * an assessment or the note for a role that only reads, "Teridentifikasi
 * perlu pembinaan" and "Hasil asesmen karakter", all of the students the
 * account may see.
 */
export function AssessmentScreen({
  tabs,
  params,
  numbers,
  periodName,
  list,
  manage,
  coaching,
}: {
  tabs: TabLinksProps;
  params: AssessmentParams;
  numbers: AssessmentNumbers;
  /** The running academic period as the screens name it, or null for none. */
  periodName: string | null;
  list: AssessmentList;
  /** "Input capaian MEDALI", or the read-only note. */
  manage: ReactNode;
  /** "Teridentifikasi perlu pembinaan". */
  coaching: ReactNode;
}) {
  return (
    <>
      <TabbedHead
        title="Penilaian"
        tabs={tabs}
        lede="Hasil asesmen capaian enam nilai MEDALI. Hasil asesmen terakhir tiap mahasiswa menjadi capaian karakternya."
      />
      <NumberCards>
        <NumberCard
          label="Sudah diasesmen"
          amount={numbers.assessed}
          note={`dari ${numbers.students.toLocaleString("id-ID")} mahasiswa aktif (${shownShare(numbers.assessed, numbers.students)})`}
        />
        <NumberCard
          label="Rerata capaian"
          amount={shownRerata(numbers.meanRerata)}
          note="enam nilai MEDALI"
        />
        <NumberCard
          label="Diasesmen semester ini"
          amount={numbers.assessedThisPeriod}
          note={thisPeriodNote(periodName)}
        />
        <NumberCard
          label="Belum diasesmen"
          amount={numbers.notAssessed}
          note="belum punya hasil asesmen"
        />
      </NumberCards>
      {manage}
      {coaching}
      <section className={shared.panel}>
        <h2 className={shared.heading}>Hasil asesmen karakter</h2>
        <p className={styles.sub}>Hasil asesmen terakhir tiap mahasiswa.</p>
        <AssessmentFilterRow params={params} />
        <AssessmentListTable rows={list.rows} params={params} />
        {list.matching > 0 && (
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={ASSESSMENT_LIST_PAGE_SIZE}
            noun="mahasiswa"
            keepsPlace
            addressOf={(page) => assessmentAddress({ ...params, page })}
          />
        )}
      </section>
    </>
  );
}
