import { CATEGORY_WORDS } from "@/health-notes/category-words";
import {
  FILTER_ILLNESSES,
  ILLNESS_CHOICES,
} from "@/health-notes/filter-choices";
import { FITNESS_CATEGORIES } from "@/health-notes/fitness-ids";
import { RESIDENCES } from "@/health-notes/health-ids";
import {
  ILLNESS_WORDS,
  illnessLine,
  listedHint,
  medicalHint,
  NOBODY_ILL,
  NOBODY_ILL_YET,
  RESIDENCE_WORDS,
  residenceHint,
} from "@/health-notes/health-words";
import {
  type RecapNumbers,
  SICK_PAGE_SIZE,
  type SickList,
} from "@/health-notes/sick-list";
import { SickTable } from "@/health-notes/sick-table";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import styles from "./fitness.module.css";
import {
  FILTER_CHOICES,
  FITNESS_ADDRESS,
  type FitnessParams,
} from "./fitness-address";
import {
  RECAP_START,
  RESIDENCE_CHOICES,
  type RecapParams,
  recapAddress,
} from "./recap-address";

/** The four numbers of the recap, above "Catatan kesehatan". */
export function RecapNumberCards({ numbers }: { numbers: RecapNumbers }) {
  return (
    <NumberCards>
      <NumberCard
        label="Mahasiswa aktif"
        amount={numbers.students}
        note={residenceHint(numbers)}
      />
      <NumberCard
        label="Sakit atau punya riwayat penyakit"
        amount={numbers.listed}
        note={listedHint(numbers, "mahasiswa")}
      />
      <NumberCard
        label="Perlu perhatian"
        amount={numbers.attention}
        note="pemantauan"
      />
      <NumberCard
        label="Perlu tindak lanjut medis"
        amount={numbers.medical}
        note={medicalHint(numbers)}
      />
    </NumberCards>
  );
}

/**
 * The search and the filters of the recap. The list's own search and
 * filter ride along, so a choice here does not undo one there.
 */
function RecapFilterRow({
  list,
  params,
}: {
  list: FitnessParams;
  params: RecapParams;
}) {
  return (
    <div className={shared.filters}>
      {list.query !== "" && (
        <input type="hidden" name="cari" value={list.query} />
      )}
      {list.filter !== "all" && (
        <input
          type="hidden"
          name="saring"
          value={FILTER_CHOICES[list.filter]}
        />
      )}
      <input
        name="rcari"
        className={shared.input}
        placeholder="Cari nama atau NIM"
        defaultValue={params.query}
        aria-label="Cari nama atau NIM di rekap"
      />
      <select
        name="rtinggal"
        className={shared.input}
        defaultValue={RESIDENCE_CHOICES[params.residence]}
        aria-label="Tempat tinggal"
      >
        {RESIDENCES.map((residence) => (
          <option key={residence} value={RESIDENCE_CHOICES[residence]}>
            {RESIDENCE_WORDS[residence]}
          </option>
        ))}
      </select>
      <select
        name="rkategori"
        className={shared.input}
        defaultValue={
          params.category === "all" ? "" : FILTER_CHOICES[params.category]
        }
        aria-label="Kategori di rekap"
      >
        <option value="">Semua kategori</option>
        {FITNESS_CATEGORIES.map((category) => (
          <option key={category} value={FILTER_CHOICES[category]}>
            {CATEGORY_WORDS[category]}
          </option>
        ))}
      </select>
      <select
        name="rriwayat"
        className={shared.input}
        defaultValue={
          params.illness === "all" ? "" : ILLNESS_CHOICES[params.illness]
        }
        aria-label="Riwayat penyakit"
      >
        <option value="">Semua riwayat penyakit</option>
        {FILTER_ILLNESSES.map((illness) => (
          <option key={illness} value={ILLNESS_CHOICES[illness]}>
            {ILLNESS_WORDS[illness]}
          </option>
        ))}
      </select>
      <button type="submit" className={shared.quiet}>
        Cari
      </button>
    </div>
  );
}

/** What the recap says when it lists nobody: none yet, or none on the filters set. */
export function nobodyIllWords(params: RecapParams): string {
  const isFiltered =
    params.query !== RECAP_START.query ||
    params.residence !== RECAP_START.residence ||
    params.category !== RECAP_START.category ||
    params.illness !== RECAP_START.illness;
  return isFiltered ? NOBODY_ILL : NOBODY_ILL_YET;
}

/**
 * "Rekap data kesehatan seluruh mahasiswa": the search, the filters and
 * one page of the students the recap lists. On a phone each student is
 * a block of its own.
 */
export function RecapPanel({
  recap,
  list,
  params,
}: {
  recap: SickList;
  /** The choices of "Hasil tes kebugaran", kept by the recap's steps. */
  list: FitnessParams;
  params: RecapParams;
}) {
  const { illness } = params;
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Rekap data kesehatan seluruh mahasiswa</h2>
      <p className={styles.sub}>
        Mahasiswa asrama dan non asrama yang memiliki riwayat penyakit, catatan
        kesehatan dengan pertimbangan kategori, atau berkategori perlu tindak
        lanjut medis.
      </p>
      <AutoSubmitForm action={FITNESS_ADDRESS}>
        <RecapFilterRow list={list} params={params} />
      </AutoSubmitForm>
      {illness !== "all" && recap.matching > 0 && (
        <p className={styles.note}>
          {illnessLine(recap.matching, illness, "mahasiswa")}
        </p>
      )}
      {recap.matching === 0 ? (
        <p className={shared.empty}>{nobodyIllWords(params)}</p>
      ) : (
        <>
          <SickTable rows={recap.rows} />
          <ListPager
            page={recap.page}
            matching={recap.matching}
            pageSize={SICK_PAGE_SIZE}
            noun="mahasiswa"
            keepsPlace
            addressOf={(page) => recapAddress(list, { ...params, page })}
          />
        </>
      )}
    </section>
  );
}
