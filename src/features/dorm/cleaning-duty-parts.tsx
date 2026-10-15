import shared from "@/ui/data-screen.module.css";
import { shownMoment } from "@/ui/day";
import styles from "./cleaning.module.css";
import { RESULT_WORDS, STATUS_WORDS } from "./cleaning-assessment";
import type { CleaningResult, CleaningStatus } from "./cleaning-ids";
import type { ScheduledDuty } from "./cleaning-schedule";

const STATUS_STYLES: Record<CleaningStatus, string | undefined> = {
  scheduled: styles.plain,
  judged: styles.warn,
  validated: styles.ok,
};

const RESULT_STYLES: Record<CleaningResult, string | undefined> = {
  met: styles.ok,
  not_met: styles.bad,
};

/** Terjadwal, Dinilai BAM or Divalidasi. */
export function CleaningStatusBadge({ status }: { status: CleaningStatus }) {
  return (
    <span className={`${shared.badge} ${STATUS_STYLES[status]}`}>
      {STATUS_WORDS[status]}
    </span>
  );
}

/** Memenuhi or Tidak memenuhi, with the points when they are given. */
export function CleaningResultBadge({
  result,
  words = RESULT_WORDS[result],
}: {
  result: CleaningResult;
  words?: string;
}) {
  return (
    <span className={`${shared.badge} ${RESULT_STYLES[result]}`}>{words}</span>
  );
}

/** Marks a duty made again after a validated Tidak memenuhi. */
export function RepeatBadge() {
  return (
    <span className={`${shared.badge} ${styles.warn}`}>Pembersihan ulang</span>
  );
}

/** Who did a step and when, such as Nama · 12 Okt 2026, 10.00. */
export function byWords(name: string | null, at: Date | null): string {
  const moment = at === null ? "" : shownMoment(at);
  return [name ?? "", moment].filter((part) => part !== "").join(" · ");
}

/**
 * The judgement of a duty as staff see it: the result, the note, who
 * judged it and when, and who validated it and when; or Belum dinilai,
 * with the reason the last judgement was sent back while it waits again.
 */
export function AssessmentCell({ duty }: { duty: ScheduledDuty }) {
  const isWaitingAgain =
    duty.status === "scheduled" && duty.sentBackReason !== "";
  return (
    <td data-title="Penilaian">
      {duty.result === null ? (
        <span className={styles.quiet}>Belum dinilai</span>
      ) : (
        <>
          <CleaningResultBadge result={duty.result} />
          {duty.judgeNote !== "" && (
            <small className={shared.detail}>{duty.judgeNote}</small>
          )}
          <small className={shared.detail}>
            Dinilai {byWords(duty.judgedByName, duty.judgedAt)}
          </small>
          {duty.status === "validated" && (
            <small className={shared.detail}>
              Divalidasi {byWords(duty.validatedByName, duty.validatedAt)}
            </small>
          )}
        </>
      )}
      {isWaitingAgain && (
        <small className={styles.sentBack}>
          Penilaian sebelumnya ditolak: {duty.sentBackReason}
        </small>
      )}
    </td>
  );
}
