import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { SEARCH_TEXT_MAX } from "@/ui/search-text";
import styles from "./counselling.module.css";
import {
  filterName,
  SCREENING_ADDRESS,
  SCREENING_FILTER_WORDS,
  SCREENING_FILTERS,
  type ScreeningParams,
  screeningAddress,
} from "./screening-address";
import { ScreeningListRow } from "./screening-row";
import type { ScreeningList } from "./screening-view";

export const NOBODY_SCREENED = "Belum ada mahasiswa yang diasesmen.";

export const NOBODY_MATCHING = "Tidak ada mahasiswa yang cocok.";

/** "Cari nama atau NIM" and the filter. */
function FilterRow({ params }: { params: ScreeningParams }) {
  return (
    <AutoSubmitForm action={SCREENING_ADDRESS}>
      <div className={shared.filters}>
        <input
          name="cari"
          className={shared.input}
          placeholder="Cari nama atau NIM"
          aria-label="Cari nama atau NIM"
          maxLength={SEARCH_TEXT_MAX}
          defaultValue={params.query}
        />
        <select
          name="filter"
          className={shared.input}
          aria-label="Filter"
          defaultValue={filterName(params.filter)}
        >
          {SCREENING_FILTERS.map((filter) => (
            <option key={filter} value={filterName(filter)}>
              {SCREENING_FILTER_WORDS[filter]}
            </option>
          ))}
        </select>
        <button type="submit" className={shared.quiet}>
          Cari
        </button>
      </div>
    </AutoSubmitForm>
  );
}

function emptyWords(params: ScreeningParams): string {
  const chosen = params.query !== "" || params.filter !== "all";
  return chosen ? NOBODY_MATCHING : NOBODY_SCREENED;
}

/**
 * "Daftar mahasiswa" of Konselor: the search, the filter and one page of
 * the screened students, the most serious first. On a phone each student
 * is a card.
 */
export function ScreeningListPanel({
  list,
  params,
}: {
  list: ScreeningList;
  params: ScreeningParams;
}) {
  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <h2 className={shared.heading}>Daftar mahasiswa</h2>
      <FilterRow params={params} />
      {list.matching === 0 ? (
        <p className={shared.empty}>{emptyWords(params)}</p>
      ) : (
        <>
          <div className={shared.tableWrap}>
            <table className={`${shared.table} ${shared.stacked}`}>
              <thead>
                <tr>
                  <th>Mahasiswa</th>
                  <th>Pengasuh</th>
                  <th>Asesmen terakhir</th>
                  <th>Tingkat</th>
                  <th>Persetujuan</th>
                  <th>
                    <span className={shared.hidden}>Rincian</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => (
                  <ScreeningListRow key={row.studentId} row={row} />
                ))}
              </tbody>
            </table>
          </div>
          <ListPager
            page={list.page}
            matching={list.matching}
            noun="mahasiswa"
            keepsPlace
            addressOf={(page) => screeningAddress({ ...params, page })}
          />
        </>
      )}
    </section>
  );
}
