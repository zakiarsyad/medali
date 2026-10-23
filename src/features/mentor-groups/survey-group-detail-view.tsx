import Link from "next/link";
import {
  FEWEST_ANSWERS_SHOWN,
  SURVEY_STATEMENTS,
} from "@/mentoring/survey-statements";
import { shownAverage } from "./evaluation-result";
import { groupAddress } from "./group-list-address";
import styles from "./mentor-groups.module.css";
import type { GroupSurveyDetail } from "./survey-group-detail";

export const HIDDEN_WORDS = `Disembunyikan karena responden kurang dari ${FEWEST_ANSWERS_SHOWN} orang, untuk menjaga kerahasiaan.`;

function Averages({ detail }: { detail: GroupSurveyDetail }) {
  if (detail.answers === 0) {
    return <p className={styles.quiet}>Belum ada responden.</p>;
  }
  if (detail.averages === null) {
    return <p className={styles.quiet}>{HIDDEN_WORDS}</p>;
  }
  const { averages } = detail;
  return (
    <ol className={styles.statements}>
      {SURVEY_STATEMENTS.map((statement, place) => (
        <li key={statement}>
          {statement} <b>{shownAverage(averages[place] ?? 0)}</b>
        </li>
      ))}
    </ol>
  );
}

function Suggestions({ detail }: { detail: GroupSurveyDetail }) {
  if (detail.answers === 0) return <p className={styles.quiet}>-</p>;
  if (detail.suggestions === null) {
    return <p className={styles.quiet}>{HIDDEN_WORDS}</p>;
  }
  if (detail.suggestions.length === 0) {
    return <p className={styles.quiet}>Tidak ada saran tertulis.</p>;
  }
  return (
    <ul className={styles.statements}>
      {detail.suggestions.map((suggestion, place) => (
        // Two students may write the same words, so the place tells them apart.
        // biome-ignore lint/suspicious/noArrayIndexKey: the list never changes order while shown.
        <li key={place}>{suggestion}</li>
      ))}
    </ul>
  );
}

/**
 * The detail of a row of "Hasil evaluasi per kelompok": the average of
 * each statement, the suggestions without names, and the way to the
 * group's page. Below 3 answers both are hidden, with the reason.
 */
export function GroupSurveyDetailView({
  detail,
  groupId,
  code,
}: {
  detail: GroupSurveyDetail;
  groupId: string;
  /** The code of the group, such as "KP 25-D3PJK-01". */
  code: string;
}) {
  return (
    <div className={styles.sideBySide}>
      <div>
        <h3 className={styles.subheading}>Rata-rata per pernyataan</h3>
        <Averages detail={detail} />
      </div>
      <div>
        <h3 className={styles.subheading}>Saran mahasiswa (tanpa nama)</h3>
        <Suggestions detail={detail} />
        <p>
          <Link href={groupAddress(groupId)}>Buka kelompok {code}</Link>
        </p>
      </div>
    </div>
  );
}
