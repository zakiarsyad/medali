import type { ReactNode } from "react";
import styles from "./counselling.module.css";
import { Fact, ScheduleBadge } from "./schedule-card-parts";
import type { ScheduleStatus } from "./schedule-ids";
import type { OwnScheduleView } from "./schedule-view";
import {
  COUNSELLING_WAY_WORDS,
  TOPIC_WORDS,
  timeWords,
} from "./schedule-words";

/** What the time of a request is, as the student reads it. */
const TIME_TITLES: Record<ScheduleStatus, string> = {
  submitted: "Waktu yang Anda pilih",
  proposed: "Usulan konselor",
  scheduled: "Jadwal",
  done: "Jadwal",
  missed: "Jadwal",
  cancelled: "Jadwal",
};

/**
 * One request of the student: where it stands, Topik, the time it is
 * about now and Cara, the Konselor of an agreed time and the message of
 * Konselor. `children` is what the card offers to do, when anything.
 */
export function OwnScheduleCard({
  schedule,
  children,
}: {
  schedule: OwnScheduleView;
  children?: ReactNode;
}) {
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <b>Konseling sukarela</b>
          <p className={styles.sub}>Didaftarkan sendiri oleh mahasiswa</p>
        </div>
        <ScheduleBadge status={schedule.status} />
      </div>
      <dl className={styles.facts}>
        <Fact title="Topik">{TOPIC_WORDS[schedule.topic]}</Fact>
        <Fact title={TIME_TITLES[schedule.status]}>
          {timeWords(schedule.day, schedule.hour)}
        </Fact>
        <Fact title="Cara">{COUNSELLING_WAY_WORDS[schedule.way]}</Fact>
        {schedule.counsellorName && (
          <Fact title="Konselor">{schedule.counsellorName}</Fact>
        )}
        {schedule.counsellorMessage && (
          <Fact title="Pesan konselor" isWide>
            {schedule.counsellorMessage}
          </Fact>
        )}
      </dl>
      {children}
    </li>
  );
}
