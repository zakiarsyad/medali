import { LevelBadges } from "@/mental-health/screening-badges";
import {
  ADVICE_WORDS,
  INSTRUMENT_WORDS,
} from "@/mental-health/screening-words";
import type { SessionSummary } from "@/mental-health/session-view";
import { FOLLOW_UP_WORDS } from "@/mental-health/session-words";
import {
  NOT_SCREENED,
  publishedLine,
  SHARED_PART_WORDS,
} from "@/mental-health/shared-words";
import { DAY, shownDay } from "@/ui/day";
import styles from "./counselling.module.css";
import type { SharedDetail, SharedScreening } from "./shared-view";

function CounsellingPart({ sessions }: { sessions: SessionSummary | null }) {
  if (sessions === null) {
    return <p className={styles.sub}>Belum ada sesi konseling.</p>;
  }
  return (
    <>
      <p>
        <b>Konseling:</b> {sessions.count} sesi, terakhir{" "}
        {shownDay(sessions.lastDay)}
      </p>
      <p>
        <b>Tindak lanjut:</b> {FOLLOW_UP_WORDS[sessions.followUp]}
      </p>
      {sessions.nextDay && (
        <p>
          <b>Sesi berikutnya:</b> {shownDay(sessions.nextDay)}
        </p>
      )}
    </>
  );
}

/**
 * "Tingkat asesmen terakhir" and "Rekomendasi". The advice is always the
 * level's own: the crisis advice would give away the "Risiko" mark.
 */
function LevelPart({ screening }: { screening: SharedScreening | null }) {
  if (screening === null) {
    return <p className={styles.sub}>{NOT_SCREENED}.</p>;
  }
  return (
    <>
      <p>
        <b>Tingkat asesmen terakhir:</b>{" "}
        <LevelBadges level={screening.level} risk={false} />{" "}
        {INSTRUMENT_WORDS[screening.instrument]},{" "}
        {shownDay(screening.screenedOn)}
      </p>
      <p>
        <b>Rekomendasi:</b> {ADVICE_WORDS[screening.level]}
      </p>
    </>
  );
}

/**
 * "Rincian" of a student, as the server sent it: only the parts the
 * student agreed to share, and who published it when.
 */
export function SharedDetailBox({ detail }: { detail: SharedDetail }) {
  return (
    <div className={`${styles.card} ${styles.stack}`}>
      {detail.data.includes("level") && (
        <section className={styles.stack}>
          <h3 className={styles.subHeading}>{SHARED_PART_WORDS.level}</h3>
          <LevelPart screening={detail.screening} />
        </section>
      )}
      {detail.data.includes("counselling") && (
        <section className={styles.stack}>
          <h3 className={styles.subHeading}>{SHARED_PART_WORDS.counselling}</h3>
          <CounsellingPart sessions={detail.counselling} />
        </section>
      )}
      {detail.summary !== null && (
        <section className={styles.stack}>
          <h3 className={styles.subHeading}>{SHARED_PART_WORDS.summary}</h3>
          <p className={styles.notes}>{detail.summary}</p>
        </section>
      )}
      <p className={styles.sub}>
        {publishedLine(detail.publishedByName, DAY.format(detail.publishedAt))}
      </p>
    </div>
  );
}
