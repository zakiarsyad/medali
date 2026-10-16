import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import { FinalCategoryBadge } from "./category-badge";
import styles from "./fitness.module.css";
import {
  FILTER_CHOICES,
  FITNESS_ADDRESS,
  type FitnessParams,
} from "./fitness-address";
import { FITNESS_CATEGORIES } from "./fitness-ids";
import { CATEGORY_WORDS } from "./fitness-words";
import { RESIDENCES } from "./health-ids";
import type { HealthRecap, RecapNumbers, RecapRow } from "./health-recap";
import {
  examinerOf,
  ILLNESS_WORDS,
  illnessLine,
  listedHint,
  medicalHint,
  NOBODY_ILL,
  NOTE_MISSING,
  noteText,
  RESIDENCE_WORDS,
  residenceHint,
  roomWords,
} from "./health-words";
import {
  ILLNESS_CHOICES,
  RECAP_ILLNESSES,
  RECAP_PAGE_SIZE,
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
        note={listedHint(numbers)}
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
        {RECAP_ILLNESSES.map((illness) => (
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

function HistoryCell({ row }: { row: RecapRow }) {
  const { note } = row;
  if (note === null) {
    return (
      <span
        className={`${shared.badge} ${styles.category} ${styles.attention}`}
      >
        {NOTE_MISSING}
      </span>
    );
  }
  return (
    <>
      {note.illnesses.map(({ illness }) => (
        <span key={illness} className={shared.badge}>
          {ILLNESS_WORDS[illness]}
        </span>
      ))}
      <small className={shared.detail}>{noteText(note)}</small>
    </>
  );
}

function RecapStudentRow({ row }: { row: RecapRow }) {
  const { note } = row;
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b className={shared.typed}>{row.name}</b>
        <small className={shared.detail}>
          {row.nim} · {row.program}
        </small>
      </td>
      <td data-title="Kamar">{roomWords(row.dorm, row.room)}</td>
      <td data-title="Pengasuh">{row.mentorName ?? "-"}</td>
      <td data-title="Kategori">
        <FinalCategoryBadge final={row.final} showsMark />
      </td>
      <td data-title="Riwayat penyakit dan catatan">
        <HistoryCell row={row} />
      </td>
      <td data-title="Dicatat">
        {note === null ? (
          "-"
        ) : (
          <>
            {shownDay(note.examinedOn)}
            <small className={shared.detail}>{examinerOf(note)}</small>
          </>
        )}
      </td>
    </tr>
  );
}

function RecapTable({ rows }: { rows: readonly RecapRow[] }) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Kamar</th>
            <th>Pengasuh</th>
            <th>Kategori</th>
            <th>Riwayat penyakit dan catatan</th>
            <th>Dicatat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <RecapStudentRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
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
  recap: HealthRecap;
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
        <p className={styles.note}>{illnessLine(recap.matching, illness)}</p>
      )}
      {recap.matching === 0 ? (
        <p className={shared.empty}>{NOBODY_ILL}</p>
      ) : (
        <>
          <RecapTable rows={recap.rows} />
          <ListPager
            page={recap.page}
            matching={recap.matching}
            pageSize={RECAP_PAGE_SIZE}
            noun="mahasiswa"
            keepsPlace
            addressOf={(page) => recapAddress(list, { ...params, page })}
          />
        </>
      )}
    </section>
  );
}
