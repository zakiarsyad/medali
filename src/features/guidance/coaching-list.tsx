import { COACHING_LEVELS } from "@/character-scores/coaching-need";
import {
  COACHING_STATUS_WORDS,
  COACHING_STATUSES,
} from "@/character-scores/coaching-status";
import { COACHING_LEVEL_WORDS } from "@/character-scores/coaching-words";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import {
  COACHING_ADDRESS,
  COACHING_PAGE_SIZE,
  type CoachingParams,
  coachingAddress,
  LEVEL_CHOICES,
  STATUS_CHOICES,
} from "./coaching-address";
import type { CoachingList } from "./coaching-board";
import styles from "./coaching-list.module.css";
import {
  COACHING_NOUN,
  COUNSELLING_ONLY_A_MARK,
  NO_COACHING_FOUND,
} from "./coaching-list-words";
import { CoachingMessageArea } from "./coaching-message";
import { CoachingTable } from "./coaching-table";

/** "Cari nama atau NIM", the level and the status, "Belum selesai" first. */
function FilterRow({ params }: { params: CoachingParams }) {
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
        name="tingkat"
        className={shared.input}
        defaultValue={params.level === "all" ? "" : LEVEL_CHOICES[params.level]}
        aria-label="Tingkat"
      >
        <option value="">Semua tingkat</option>
        {COACHING_LEVELS.map((level) => (
          <option key={level} value={LEVEL_CHOICES[level]}>
            {COACHING_LEVEL_WORDS[level]}
          </option>
        ))}
      </select>
      <select
        name="status"
        className={shared.input}
        defaultValue={
          params.status === "open" ? "" : STATUS_CHOICES[params.status]
        }
        aria-label="Status"
      >
        <option value="">Belum selesai</option>
        <option value={STATUS_CHOICES.all}>Semua status</option>
        {COACHING_STATUSES.map((status) => (
          <option key={status} value={STATUS_CHOICES[status]}>
            {COACHING_STATUS_WORDS[status]}
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
 * The search, the filters and one page of the students, with the line
 * that Konseling here is only a mark. On a phone each student is a card.
 */
export function CoachingListPanel({
  list,
  params,
}: {
  list: CoachingList;
  params: CoachingParams;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.hidden}>Daftar mahasiswa</h2>
      <AutoSubmitForm action={COACHING_ADDRESS}>
        <FilterRow params={params} />
      </AutoSubmitForm>
      <CoachingMessageArea>
        {list.matching === 0 ? (
          <p className={shared.empty}>{NO_COACHING_FOUND}</p>
        ) : (
          <>
            <CoachingTable rows={list.rows} params={params} />
            <ListPager
              page={list.page}
              matching={list.matching}
              pageSize={COACHING_PAGE_SIZE}
              noun={COACHING_NOUN}
              addressOf={(page) => coachingAddress({ ...params, page })}
            />
          </>
        )}
      </CoachingMessageArea>
      <p className={styles.mark}>{COUNSELLING_ONLY_A_MARK}</p>
    </section>
  );
}
