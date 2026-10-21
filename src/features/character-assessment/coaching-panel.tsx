import Link from "next/link";
import { rerataOf } from "@/character-scores/assessment-score";
import {
  type CoachingLevel,
  LISTED_BELOW_RERATA,
  LISTED_BELOW_SCORE,
} from "@/character-scores/coaching-need";
import { COACHING_LEVEL_WORDS } from "@/character-scores/coaching-words";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";
import {
  type AssessmentParams,
  assessmentAddress,
  COACHING_PAGE_SIZE,
} from "./assessment-address";
import styles from "./character-assessment.module.css";
import type { CoachingList, CoachingRow } from "./coaching-list";

export const NO_COACHING =
  "Tidak ada mahasiswa yang teridentifikasi perlu pembinaan.";

const LEVEL_LOOKS: Record<CoachingLevel, string | undefined> = {
  intensive: styles.intensive,
  moderate: styles.moderate,
  light: styles.light,
};

function valueName(key: ValueKey): string {
  const found = MEDALI_VALUES.find((value) => value.key === key);
  return found?.name ?? key;
}

function CoachingRowCells({ row }: { row: CoachingRow }) {
  const { level, weakest } = row.need;
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b className={shared.typed}>{row.name}</b>
        <small className={shared.detail}>
          {row.nim} · {row.program}
        </small>
      </td>
      <td data-title="Tingkat">
        <span className={`${shared.badge} ${LEVEL_LOOKS[level]}`}>
          {COACHING_LEVEL_WORDS[level]}
        </span>
      </td>
      <td className={styles.strong} data-title="Rerata MEDALI">
        {shownRerata(rerataOf(row.scores))}
      </td>
      <td data-title="Aspek terlemah">
        {valueName(weakest)}{" "}
        <span className={styles.weakScore}>{row.scores[weakest]}</span>
      </td>
    </tr>
  );
}

function CoachingTable({ rows }: { rows: readonly CoachingRow[] }) {
  if (rows.length === 0) return <p className={shared.empty}>{NO_COACHING}</p>;
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Tingkat</th>
            <th>Rerata MEDALI</th>
            <th>Aspek terlemah</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <CoachingRowCells key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** "Tampilkan semua (n)" under the first rows, or the pages of the full list. */
function CoachingMore({
  list,
  params,
}: {
  list: CoachingList;
  params: AssessmentParams;
}) {
  if (list.showsAll) {
    if (list.matching === 0) return null;
    return (
      <ListPager
        page={list.page}
        matching={list.matching}
        pageSize={COACHING_PAGE_SIZE}
        noun="mahasiswa"
        keepsPlace
        stepsOnOnePage={false}
        addressOf={(page) =>
          assessmentAddress({ ...params, coachingPage: page })
        }
      />
    );
  }
  if (list.matching <= list.rows.length) return null;
  const allAddress = assessmentAddress({
    ...params,
    coachingAll: true,
    coachingPage: 1,
  });
  return (
    <p className={styles.more}>
      <Link href={allAddress} className={shared.link} scroll={false}>
        Tampilkan semua ({list.matching.toLocaleString("id-ID")})
      </Link>
    </p>
  );
}

/**
 * "Teridentifikasi perlu pembinaan": the students the account sees whose
 * latest assessment is low, with how serious it is and their weakest
 * value. On a phone each student is a block of its own.
 */
export function CoachingPanel({
  list,
  params,
}: {
  list: CoachingList;
  params: AssessmentParams;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Teridentifikasi perlu pembinaan</h2>
      <p className={styles.sub}>
        Dari hasil asesmen karakter (rerata di bawah {LISTED_BELOW_RERATA} atau
        satu nilai di bawah {LISTED_BELOW_SCORE}). Penilai Mahasiswa dapat
        memanggil mahasiswa untuk konseling bila diperlukan.
      </p>
      <CoachingTable rows={list.rows} />
      <CoachingMore list={list} params={params} />
    </section>
  );
}
