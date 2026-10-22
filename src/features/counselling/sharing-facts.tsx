import {
  dataLine,
  recipientsLine,
  SHARING_WAY_WORDS,
} from "@/mental-health/sharing-words";
import { DAY } from "@/ui/day";
import styles from "./counselling.module.css";
import { SharingBadge } from "./sharing-badge";
import type { SharingView } from "./sharing-view";

/** How it was approved and when, and who published it and when. */
function stepsLine(sharing: SharingView): string {
  const parts: string[] = [];
  if (sharing.way && sharing.answeredAt) {
    parts.push(
      `${SHARING_WAY_WORDS[sharing.way]}, ${DAY.format(sharing.answeredAt)}`,
    );
  }
  if (sharing.publishedAt) {
    const by = sharing.publishedByName
      ? ` oleh ${sharing.publishedByName}`
      : "";
    parts.push(`Dipublikasikan ${DAY.format(sharing.publishedAt)}${by}`);
  }
  return parts.join(" · ");
}

/**
 * A sharing as Konselor reads it, as in the prototype: its status, who
 * it is for, what it gives, and the exact summary.
 */
export function SharingFacts({ sharing }: { sharing: SharingView }) {
  const steps = stepsLine(sharing);
  return (
    <div className={styles.card}>
      <p className={styles.status}>
        <b>Status:</b> <SharingBadge status={sharing.status} />
        {steps && <span className={styles.sub}>{steps}</span>}
      </p>
      <p className={styles.sub}>
        Penerima: {recipientsLine(sharing.recipients)}. Data:{" "}
        {dataLine(sharing.data)}.
        {sharing.summary && <> Ringkasan: “{sharing.summary}”</>}
      </p>
    </div>
  );
}
