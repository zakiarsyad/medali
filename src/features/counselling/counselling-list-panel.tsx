import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import { SEARCH_TEXT_MAX } from "@/ui/search-text";
import styles from "./counselling.module.css";
import {
  COUNSELLING_LIST_FILTER_WORDS,
  COUNSELLING_LIST_FILTERS,
  COUNSELLING_LIST_PAGE_SIZE,
  type CounsellingListParams,
  counsellingListAddress,
  listFilterName,
} from "./counselling-list-address";
import { CounsellingListTable } from "./counselling-list-table";
import type {
  CounsellingNumbers,
  CounsellingStudentList,
} from "./counselling-list-view";
import {
  NO_COUNSELLING_DATA,
  NOBODY_ON_FILTER,
} from "./counselling-list-words";
import { COUNSELLING_ADDRESS } from "./schedule-address";

/** What Konselor sees of the students they work with on Konseling. */
export interface CounsellorStudents {
  numbers: CounsellingNumbers;
  list: CounsellingStudentList;
  params: CounsellingListParams;
}

function CounsellingNumberCards({ numbers }: { numbers: CounsellingNumbers }) {
  return (
    <NumberCards>
      <NumberCard
        label="Menunggu persetujuan"
        amount={numbers.waitingConsent}
        note="form consent"
      />
      <NumberCard
        label="Sesi 30 hari terakhir"
        amount={numbers.recentSessions}
        note="konseling"
      />
    </NumberCards>
  );
}

/** "Cari nama atau NIM" and the filter, kept in the address. */
function FilterRow({ params }: { params: CounsellingListParams }) {
  return (
    <AutoSubmitForm action={COUNSELLING_ADDRESS}>
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
          defaultValue={listFilterName(params.filter)}
        >
          {COUNSELLING_LIST_FILTERS.map((filter) => (
            <option key={filter} value={listFilterName(filter)}>
              {COUNSELLING_LIST_FILTER_WORDS[filter]}
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

function emptyWords(params: CounsellingListParams): string {
  const chosen = params.query !== "" || params.filter !== "all";
  return chosen ? NOBODY_ON_FILTER : NO_COUNSELLING_DATA;
}

/**
 * The numbers and "Daftar mahasiswa" of Konselor on Konseling: the
 * search, the filter and one page of every student with a consent
 * record, a schedule or a session, by name. On a phone each student is
 * a card.
 */
export function CounsellingListPart({
  students,
}: {
  students: CounsellorStudents;
}) {
  const { numbers, list, params } = students;
  return (
    <>
      <CounsellingNumberCards numbers={numbers} />
      <section className={`${shared.panel} ${styles.stack}`}>
        <h2 className={shared.heading}>Daftar mahasiswa</h2>
        <FilterRow params={params} />
        {list.matching === 0 ? (
          <p className={shared.empty}>{emptyWords(params)}</p>
        ) : (
          <>
            <CounsellingListTable rows={list.rows} />
            <ListPager
              page={list.page}
              matching={list.matching}
              pageSize={COUNSELLING_LIST_PAGE_SIZE}
              noun="mahasiswa"
              keepsPlace
              stepsOnOnePage={false}
              addressOf={(page) => counsellingListAddress({ ...params, page })}
            />
          </>
        )}
      </section>
    </>
  );
}
