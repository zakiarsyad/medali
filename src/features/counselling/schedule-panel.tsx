import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import styles from "./counselling.module.css";
import { CounsellorScheduleItem } from "./counsellor-schedule-item";
import {
  SCHEDULES_PAGE_SIZE,
  type ScheduleFilter,
  scheduleListAddress,
} from "./schedule-address";
import { ScheduleFilterRow } from "./schedule-filter";
import { ScheduleNotice } from "./schedule-notice";
import type { ScheduleBoard } from "./schedule-view";

/**
 * "Jadwal konseling" of Konselor: the numbers, the Status filter, and
 * one page of the request cards.
 */
export function SchedulePanel({
  board,
  filter,
}: {
  board: ScheduleBoard;
  filter: ScheduleFilter;
}) {
  const { counts, cards } = board;
  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <h2 className={shared.heading}>Jadwal konseling</h2>
      <NumberCards>
        <NumberCard
          label="Perlu dijadwalkan"
          amount={counts.submitted}
          note="permintaan"
        />
        <NumberCard
          label="Dijadwalkan 7 hari ke depan"
          amount={counts.scheduledSoon}
          note="sesi"
        />
        <NumberCard
          label="Menunggu konfirmasi mahasiswa"
          amount={counts.proposed}
          note="usulan jadwal lain"
        />
      </NumberCards>
      <ScheduleFilterRow filter={filter} />
      <ScheduleNotice>
        {cards.length === 0 ? (
          <p className={shared.empty}>Tidak ada konseling pada filter ini.</p>
        ) : (
          <ul className={styles.cards}>
            {cards.map((card) => (
              <CounsellorScheduleItem
                key={card.id + card.version}
                card={card}
              />
            ))}
          </ul>
        )}
        {board.matching > 0 && (
          <ListPager
            page={board.page}
            matching={board.matching}
            pageSize={SCHEDULES_PAGE_SIZE}
            noun="permintaan"
            keepsPlace
            stepsOnOnePage={false}
            addressOf={(page) => scheduleListAddress(filter, page)}
          />
        )}
      </ScheduleNotice>
    </section>
  );
}
