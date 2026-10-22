import { StudentLink } from "@/mentoring/student-link";
import shared from "@/ui/data-screen.module.css";
import styles from "./dashboard.module.css";
import { menteeDetailAddress } from "./dashboard-kind";
import {
  ATTENTION_SHOWN,
  type AttentionRow,
  averageWords,
  type ReasonTone,
} from "./mentee-attention";

const TONE_LOOKS: Record<ReasonTone, string | undefined> = {
  serious: styles.seriousTag,
  warning: styles.warningTag,
};

function AttentionItem({ row }: { row: AttentionRow }) {
  const address = row.opensDetail ? menteeDetailAddress(row.studentId) : null;
  return (
    <li className={styles.attentionItem}>
      <span>
        <StudentLink name={row.name} address={address} />{" "}
        <span className={styles.attentionAverage}>
          · {averageWords(row.rerata)}
        </span>
      </span>
      <span className={styles.tags}>
        {row.reasons.map((reason) => (
          <span
            key={reason.words}
            className={`${shared.badge} ${TONE_LOOKS[reason.tone]}`}
          >
            {reason.words}
          </span>
        ))}
      </span>
    </li>
  );
}

function AttentionItems({ rows }: { rows: readonly AttentionRow[] }) {
  return (
    <ul className={styles.attentionList}>
      {rows.map((row) => (
        <AttentionItem key={row.studentId} row={row} />
      ))}
    </ul>
  );
}

/**
 * "Perlu perhatian": the anak asuh with at least one reason, as the
 * server sent them, the first 8 at once and the rest behind "Lihat
 * semua". A name opens the student's detail over the Dashboard.
 */
export function MenteeAttentionPanel({
  rows,
}: {
  rows: readonly AttentionRow[];
}) {
  const first = rows.slice(0, ATTENTION_SHOWN);
  const rest = rows.slice(ATTENTION_SHOWN);
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Perlu perhatian</h2>
        <span className={styles.attentionAverage}>
          {rows.length.toLocaleString("id-ID")} anak asuh
        </span>
      </div>
      {rows.length === 0 ? (
        <p className={shared.empty}>
          Tidak ada anak asuh yang perlu perhatian khusus saat ini.
        </p>
      ) : (
        <AttentionItems rows={first} />
      )}
      {rest.length > 0 && (
        <details className={styles.more}>
          <summary>Lihat semua</summary>
          <AttentionItems rows={rest} />
        </details>
      )}
    </section>
  );
}
