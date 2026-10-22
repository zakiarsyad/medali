import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { JenjangBadge } from "./penalty-badges";
import { CHARACTER_SCORE_CAP, ruleOf } from "./penalty-rules";
import { inSentence, lengthWords, STATUS_WORDS } from "./penalty-words";
import type { StudentPenalty } from "./student-penalties";
import styles from "./student-penalties.module.css";

/** How many records show before the rest is folded behind "Tampilkan semua". */
const PENALTIES_SHOWN = 10;

/**
 * What a penalty does, as the prototype says it: "Hukuman: teguran lisan
 * tertulis, kerja sosial 7 hari, nilai karakter paling tinggi 70."
 */
function penaltyWords(penalty: StudentPenalty): string {
  const rule = ruleOf(penalty.category, penalty.level);
  const parts = [`Hukuman: ${inSentence(rule.penalty)}`];
  if (penalty.hasSocialWork && rule.socialWork !== null) {
    parts.push(`kerja sosial ${lengthWords(rule.socialWork)}`);
  }
  if (rule.outcome === "capped") {
    parts.push(`nilai karakter paling tinggi ${CHARACTER_SCORE_CAP}`);
  }
  return `${parts.join(", ")}.`;
}

function PenaltyItem({ penalty }: { penalty: StudentPenalty }) {
  return (
    <li className={styles.item}>
      <span className={styles.quiet}>{shownDay(penalty.day)}</span>
      <p className={styles.itemTitle}>
        <JenjangBadge category={penalty.category} level={penalty.level} />
        <span className={styles.quiet}>{STATUS_WORDS[penalty.status]}</span>
      </p>
      <p className={styles.text}>{penalty.description}</p>
      <p className={styles.text}>{penaltyWords(penalty)}</p>
    </li>
  );
}

function PenaltyItems({ penalties }: { penalties: StudentPenalty[] }) {
  return (
    <ul className={styles.list}>
      {penalties.map((penalty) => (
        <PenaltyItem key={penalty.id} penalty={penalty} />
      ))}
    </ul>
  );
}

/**
 * "Riwayat pelanggaran disiplin" in a student's detail: how many records
 * there are and each of them, the newest first. A long history shows its
 * first records and folds the rest behind "Tampilkan semua".
 */
export function StudentPenaltiesView({
  penalties,
  recordAddress,
}: {
  penalties: StudentPenalty[];
  /**
   * Where "Catat pelanggaran" opens the form on this student, or null for
   * an account that may not record for them: it gets no button.
   */
  recordAddress: string | null;
}) {
  const first = penalties.slice(0, PENALTIES_SHOWN);
  const rest = penalties.slice(PENALTIES_SHOWN);
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Riwayat pelanggaran disiplin</h2>
        <span className={styles.quiet}>
          {penalties.length.toLocaleString("id-ID")} catatan
        </span>
      </div>
      <PenaltyItems penalties={first} />
      {rest.length > 0 && (
        <details className={styles.more}>
          <summary className={shared.link}>
            Tampilkan semua ({penalties.length.toLocaleString("id-ID")})
          </summary>
          <PenaltyItems penalties={rest} />
        </details>
      )}
      {recordAddress !== null && (
        <p className={styles.actions}>
          <Link href={recordAddress} className={shared.quiet}>
            Catat pelanggaran
          </Link>
        </p>
      )}
    </section>
  );
}
