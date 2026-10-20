import type { ReactNode } from "react";
import styles from "./counselling.module.css";
import { Fact, ScheduleBadge } from "./schedule-card-parts";
import type { ScheduleStatus } from "./schedule-ids";
import type { CounsellorScheduleCard } from "./schedule-view";
import {
  COUNSELLING_WAY_WORDS,
  STEP_WORDS,
  TOPIC_WORDS,
  timeWords,
} from "./schedule-words";

/** What the time of a request is, as Konselor reads it. */
const TIME_TITLES: Record<ScheduleStatus, string> = {
  submitted: "Waktu yang diminta",
  proposed: "Usulan konselor",
  scheduled: "Jadwal",
  done: "Jadwal",
  missed: "Jadwal",
  cancelled: "Jadwal",
};

function Steps({ card }: { card: CounsellorScheduleCard }) {
  return (
    <details className={styles.steps}>
      <summary>Riwayat langkah</summary>
      <ol>
        {card.steps.map((line) => (
          <li key={line.id}>
            {line.at} · {line.by} · {STEP_WORDS[line.step]}
          </li>
        ))}
      </ol>
    </details>
  );
}

/**
 * One request on Konselor's "Jadwal konseling": the student with NIM and
 * program studi, where it stands, Topik, the time it is about now and
 * Cara, the Konselor of a proposed or agreed time, the student's story,
 * why they asked for another time, and "Riwayat langkah". `children` is
 * what the card offers to do, when anything.
 */
export function CounsellorScheduleCardView({
  card,
  children,
}: {
  card: CounsellorScheduleCard;
  children?: ReactNode;
}) {
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <b>{card.name}</b>
          <p className={styles.sub}>
            {card.nim} · {card.program}
          </p>
        </div>
        <ScheduleBadge status={card.status} />
      </div>
      <dl className={styles.facts}>
        <Fact title="Topik">{TOPIC_WORDS[card.topic]}</Fact>
        <Fact title={TIME_TITLES[card.status]}>
          {timeWords(card.day, card.hour)}
        </Fact>
        <Fact title="Cara">{COUNSELLING_WAY_WORDS[card.way]}</Fact>
        {card.counsellorName && (
          <Fact title="Konselor">{card.counsellorName}</Fact>
        )}
        {card.story && (
          <Fact title="Cerita mahasiswa (rahasia)" isWide>
            {card.story}
          </Fact>
        )}
        {card.reason && (
          <Fact title="Alasan minta jadwal ulang" isWide>
            {card.reason}
          </Fact>
        )}
      </dl>
      <Steps card={card} />
      {children}
    </li>
  );
}
