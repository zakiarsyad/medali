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
import { ScreeningTable } from "./screening-table";
import type { ScreeningList } from "./screening-view";

export const NOBODY_SCREENED = "Belum ada mahasiswa yang diasesmen.";

export const NOBODY_MATCHING = "Tidak ada mahasiswa pada filter ini.";

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
        {params.sharedPage > 1 && (
          <input type="hidden" name="hal-data" value={params.sharedPage} />
        )}
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
          <ScreeningTable rows={list.rows} params={params} />
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
