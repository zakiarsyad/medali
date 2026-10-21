import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import {
  CATEGORY_CHOICES,
  PENALTIES_ADDRESS,
  type PenaltiesParams,
  penaltiesAddress,
  STATUS_CHOICES,
} from "./penalty-address";
import type { PenaltyBoard } from "./penalty-board";
import {
  PENALTIES_PAGE_SIZE,
  PENALTY_CATEGORIES,
  PENALTY_STATUSES,
} from "./penalty-ids";
import { PenaltyTable } from "./penalty-table";
import {
  CATEGORY_WORDS,
  NO_PENALTIES_FOUND,
  PENALTY_NOUN,
  STATUS_WORDS,
} from "./penalty-words";

/** "Cari nama atau NIM", the Kategori and the status. */
function FilterRow({ params }: { params: PenaltiesParams }) {
  return (
    <div className={shared.filters}>
      <input
        name="cari"
        className={shared.input}
        placeholder="Cari nama atau NIM"
        defaultValue={params.query}
        aria-label="Cari nama atau NIM"
      />
      <select
        name="kategori"
        className={shared.input}
        defaultValue={
          params.category === "all" ? "" : CATEGORY_CHOICES[params.category]
        }
        aria-label="Kategori"
      >
        <option value="">Semua kategori</option>
        {PENALTY_CATEGORIES.map((category) => (
          <option key={category} value={CATEGORY_CHOICES[category]}>
            {CATEGORY_WORDS[category]}
          </option>
        ))}
      </select>
      <select
        name="status"
        className={shared.input}
        defaultValue={
          params.status === "all" ? "" : STATUS_CHOICES[params.status]
        }
        aria-label="Status"
      >
        <option value="">Semua status</option>
        {PENALTY_STATUSES.map((status) => (
          <option key={status} value={STATUS_CHOICES[status]}>
            {STATUS_WORDS[status]}
          </option>
        ))}
      </select>
      <button type="submit" className={shared.quiet}>
        Cari
      </button>
    </div>
  );
}

/**
 * "Daftar pelanggaran": the search, the filters and one page of the
 * penalties. On a phone each penalty is a card.
 */
export function PenaltyListPanel({
  board,
  params,
  mayFollowUp,
}: {
  board: PenaltyBoard;
  params: PenaltiesParams;
  mayFollowUp: boolean;
}) {
  const { list } = board;
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Daftar pelanggaran</h2>
      <AutoSubmitForm action={PENALTIES_ADDRESS}>
        <FilterRow params={params} />
      </AutoSubmitForm>
      {list.matching === 0 ? (
        <p className={shared.empty}>{NO_PENALTIES_FOUND}</p>
      ) : (
        <>
          <PenaltyTable rows={list.rows} mayFollowUp={mayFollowUp} />
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={PENALTIES_PAGE_SIZE}
            noun={PENALTY_NOUN}
            addressOf={(page) => penaltiesAddress({ ...params, page })}
          />
        </>
      )}
    </section>
  );
}
