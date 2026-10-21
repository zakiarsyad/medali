import type { ReactNode } from "react";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { CategoryPanel } from "./category-panel";
import styles from "./fitness.module.css";
import {
  FITNESS_LIST_PAGE_SIZE,
  type FitnessParams,
  fitnessAddress,
} from "./fitness-address";
import type { FitnessList } from "./fitness-board";
import type { FitnessNumbers } from "./fitness-counts";
import { FitnessFilterRow } from "./fitness-filters";
import { FitnessListTable } from "./fitness-list-table";
import { READ_ONLY_NOTE, shownMean } from "./fitness-words";

/** What a role that only reads the scores sees where the form would be. */
export function ReadOnlyNote() {
  return <p className={styles.readOnly}>{READ_ONLY_NOTE}</p>;
}

function Numbers({ numbers, year }: { numbers: FitnessNumbers; year: number }) {
  const { byCategory } = numbers;
  const excellentAndGood = byCategory.excellent + byCategory.good;
  return (
    <NumberCards>
      <NumberCard
        label={`Sudah dites ${year}`}
        amount={numbers.testedThisYear}
        note={`dari ${numbers.students.toLocaleString("id-ID")} mahasiswa aktif`}
      />
      <NumberCard
        label="Rerata skor"
        amount={shownMean(numbers.meanScore)}
        note={`${excellentAndGood.toLocaleString("id-ID")} prima dan baik`}
      />
      <NumberCard label="Perlu perhatian" amount={byCategory.attention} />
      <NumberCard
        label="Perlu tindak lanjut medis"
        amount={byCategory.medical}
      />
    </NumberCards>
  );
}

/**
 * Penilaian jasmani: the four numbers, "Input hasil tes kebugaran" beside
 * "Kategori", the health part the account may have, and "Hasil tes
 * kebugaran", all of the students the account may see.
 */
export function FitnessScreen({
  tabs,
  year,
  numbers,
  limits,
  params,
  list,
  showsNotes,
  manage,
  limitsPart,
  health = null,
}: {
  tabs: TabLinksProps;
  /** The calendar year now running on campus. */
  year: number;
  numbers: FitnessNumbers;
  limits: FitnessLimits;
  params: FitnessParams;
  list: FitnessList;
  /** Whether "Hasil tes kebugaran" has the column "Catatan kesehatan". */
  showsNotes: boolean;
  /** The group form, or the note for a role that only reads. */
  manage: ReactNode;
  /** "Ambang skor", to change or only to read. */
  limitsPart: ReactNode;
  /** "Catatan kesehatan" for the roles that write notes; nothing for the others. */
  health?: ReactNode;
}) {
  return (
    <>
      <PageHead title="Penilaian jasmani">
        Penilaian jasmani berdasarkan skor tes kebugaran tahunan (0–100) yang
        diinput secara kolektif.
      </PageHead>
      <TabLinks {...tabs} />
      <Numbers numbers={numbers} year={year} />
      <div className={styles.sideBySide}>
        <section className={shared.panel}>
          <h2 className={shared.heading}>Input hasil tes kebugaran</h2>
          <p className={styles.sub}>
            Data utama penilaian jasmani, dites setahun sekali. Skor 0–100.
          </p>
          {manage}
        </section>
        <CategoryPanel numbers={numbers} limits={limits}>
          {limitsPart}
        </CategoryPanel>
      </div>
      {health}
      <section className={shared.panel}>
        <h2 className={shared.heading}>Hasil tes kebugaran</h2>
        <FitnessFilterRow params={params} />
        <FitnessListTable
          rows={list.rows}
          showsNotes={showsNotes}
          params={params}
        />
        {list.matching > 0 && (
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={FITNESS_LIST_PAGE_SIZE}
            noun="mahasiswa"
            keepsPlace
            addressOf={(page) => fitnessAddress({ ...params, page })}
          />
        )}
      </section>
    </>
  );
}
