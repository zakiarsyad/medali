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
import { ScheduleNotice, ScheduleNoticeMessage } from "./schedule-notice";
import { ScheduleSessionPart } from "./schedule-session-part";
import type { ScheduleBoard } from "./schedule-view";

/**
 * "Jadwal konseling" of Konselor: the numbers, the Status filter, and
 * one page of the request cards, with the session "Tandai selesai"
 * opened above them for an account that may keep sessions.
 */
export function SchedulePanel({
  board,
  filter,
  mayKeepSessions = false,
}: {
  board: ScheduleBoard;
  filter: ScheduleFilter;
  mayKeepSessions?: boolean;
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
      {/* A new filter or page starts with no message. */}
      <ScheduleNotice clearOn={scheduleListAddress(filter, board.page)}>
        <ScheduleNoticeMessage />
        <ScheduleSessionPart />
        {cards.length === 0 ? (
          <p className={shared.empty}>Tidak ada konseling pada filter ini.</p>
        ) : (
          <ul className={styles.cards}>
            {cards.map((card) => (
              <CounsellorScheduleItem
                key={card.id + card.version}
                card={card}
                mayKeepSessions={mayKeepSessions}
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
