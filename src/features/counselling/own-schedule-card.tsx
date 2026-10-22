import type { ReactNode } from "react";
import type { ScheduleStatus } from "@/mental-health/schedule-ids";
import styles from "./counselling.module.css";
import { Fact, MandatoryBadge, ScheduleBadge } from "./schedule-card-parts";
import type { OwnScheduleView } from "./schedule-view";
import {
  COUNSELLING_WAY_WORDS,
  KIND_SOURCE_WORDS,
  kindTitle,
  SCHEDULE_TOPIC_WORDS,
  timeWords,
  WAITING_FOR_TIME,
} from "./schedule-words";

/** What the time of a request is, as the student reads it. */
const TIME_TITLES: Record<ScheduleStatus, string> = {
  submitted: "Waktu yang Anda pilih",
  proposed: "Usulan konselor",
  scheduled: "Jadwal",
  done: "Jadwal",
  missed: "Jadwal",
  cancelled: "Jadwal",
  awaiting: "Jadwal",
  reschedule_asked: "Waktu yang Anda pilih",
};

/**
 * One request or assignment of the student: its Jenis, marked "wajib"
 * for an assignment, where it comes from and where it stands, Topik, the
 * time it is about now and Cara, the Konselor of an agreed time and the
 * message of Konselor. `children` is what the card offers to do, when
 * anything.
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
          <div className={styles.badges}>
            <b>{kindTitle(schedule.kind)}</b>
            {schedule.kind !== "voluntary" && <MandatoryBadge />}
          </div>
          <p className={styles.sub}>{KIND_SOURCE_WORDS[schedule.kind]}</p>
        </div>
        <ScheduleBadge status={schedule.status} />
      </div>
      <dl className={styles.facts}>
        <Fact title="Topik">{SCHEDULE_TOPIC_WORDS[schedule.topic]}</Fact>
        <Fact title={TIME_TITLES[schedule.status]}>
          {schedule.day && schedule.hour
            ? timeWords(schedule.day, schedule.hour)
            : WAITING_FOR_TIME}
        </Fact>
        {schedule.way && (
          <Fact title="Cara">{COUNSELLING_WAY_WORDS[schedule.way]}</Fact>
        )}
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
