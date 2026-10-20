import { shownDay } from "@/ui/day";
import styles from "./counselling.module.css";
import { LevelBadges } from "./screening-badges";
import type { ScalePart } from "./screening-rules";
import type { ScreeningDetailItem } from "./screening-view";
import { INSTRUMENT_WORDS, LEVEL_WORDS, SCALE_WORDS } from "./screening-words";

/*
 * "Riwayat asesmen" of "Rincian". Read by the list in the browser, so
 * nothing here may take from the database code.
 */

function scaleLine(parts: ScalePart[]): string {
  return parts
    .map(
      (part) =>
        `${SCALE_WORDS[part.scale]} ${part.score} (${LEVEL_WORDS[part.level].toLowerCase()})`,
    )
    .join(" · ");
}

function scoreLine(item: ScreeningDetailItem): string {
  if (item.instrument === "srq20") return `Skor SRQ-20: ${item.srqYes ?? 0}`;
  return scaleLine(item.scales);
}

/** Every screening of a student, the newest first. */
export function ScreeningHistory({ items }: { items: ScreeningDetailItem[] }) {
  return (
    <div className={styles.stack}>
      <h3 className={styles.subHeading}>Riwayat asesmen</h3>
      {items.map((item) => (
        <div key={item.id} className={styles.card}>
          <p className={styles.status}>
            <b>
              {shownDay(item.screenedOn)} · {INSTRUMENT_WORDS[item.instrument]}
            </b>
            <LevelBadges level={item.level} risk={item.risk} />
          </p>
          <p className={styles.sub}>
            {scoreLine(item)}. Rekomendasi: {item.advice}.
          </p>
          {item.note !== "" && <p className={styles.note}>{item.note}</p>}
        </div>
      ))}
    </div>
  );
}
