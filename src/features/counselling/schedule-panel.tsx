import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards, WordsCard } from "@/ui/number-cards";
import styles from "./counselling.module.css";
import { CounsellorScheduleItem } from "./counsellor-schedule-item";
import {
  SCHEDULES_PAGE_SIZE,
  type ScheduleFilter,
  scheduleListAddress,
} from "./schedule-address";
import { ScheduleFilterRow } from "./schedule-filter";
import { SCHEDULE_KINDS, type ScheduleKind } from "./schedule-ids";
import { ScheduleNotice, ScheduleNoticeMessage } from "./schedule-notice";
import { ScheduleSessionPart } from "./schedule-session-part";
import type { ScheduleBoard, ScheduleCounts } from "./schedule-view";
import { KIND_WORDS } from "./schedule-words";

/** The active ones per Jenis, such as Sukarela 4 · Penugasan 2 · Pemanggilan 1. */
function kindCountWords(counts: ScheduleCounts): string {
  return SCHEDULE_KINDS.map(
    (kind) => `${KIND_WORDS[kind]} ${counts.activeByKind[kind]}`,
  ).join(" · ");
}

/**
 * "Jadwal konseling" of Konselor: the numbers, the Status and Jenis
 * filters, and one page of the request cards, with the session "Tandai selesai"
 * opened above them for an account that may keep sessions.
 */
export function SchedulePanel({
  board,
  filter,
  kind = null,
  mayKeepSessions = false,
}: {
  board: ScheduleBoard;
  filter: ScheduleFilter;
  kind?: ScheduleKind | null;
  mayKeepSessions?: boolean;
}) {
  const { counts, cards } = board;
  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <h2 className={shared.heading}>Jadwal konseling</h2>
      <NumberCards>
        <NumberCard
          label="Perlu dijadwalkan"
          amount={counts.toSchedule}
          note="permintaan dan penugasan"
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
        <WordsCard label="Jenis" words={kindCountWords(counts)} note="aktif" />
      </NumberCards>
      <ScheduleFilterRow filter={filter} kind={kind} />
      {/* A new filter or page starts with no message. */}
      <ScheduleNotice clearOn={scheduleListAddress(filter, board.page, kind)}>
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
            addressOf={(page) => scheduleListAddress(filter, page, kind)}
          />
        )}
      </ScheduleNotice>
    </section>
  );
}
