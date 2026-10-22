import Link from "next/link";
import { LevelBadges } from "@/mental-health/screening-badges";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import styles from "./dashboard.module.css";
import type { PublishedMental, PublishedRow } from "./mental-recap";
import { NOTHING_PUBLISHED, publishedLine } from "./mental-words";

/** One student: the date, the name with the level when shared, and the line under it. */
function PublishedItem({ row }: { row: PublishedRow }) {
  const line = publishedLine(row);
  return (
    <li className={styles.publishedItem}>
      <span className={styles.when}>{DAY.format(row.publishedAt)}</span>
      <div className={styles.publishedBody}>
        <b>{row.name}</b>{" "}
        {row.level !== null && <LevelBadges level={row.level} risk={false} />}
        {line !== "" && <p className={styles.publishedLine}>{line}</p>}
      </div>
    </li>
  );
}

/**
 * "Data kesehatan mental yang dipublikasikan": the newest students whose
 * data a counsellor published to the account, as the server sent them.
 * A name is not a link; "Lihat rincian" opens Penilaian > Kesehatan
 * mental, for an account that may open it.
 */
export function PublishedPanel({
  published,
  detailAddress,
}: {
  published: PublishedMental | null;
  detailAddress: string | null;
}) {
  const rows = published?.rows ?? [];
  return (
    <div className={shared.panel}>
      <div className={styles.panelHead}>
        <h3 className={shared.heading}>
          Data kesehatan mental yang dipublikasikan
        </h3>
        {detailAddress !== null && (
          <Link href={detailAddress} className={shared.quiet}>
            Lihat rincian
          </Link>
        )}
      </div>
      {rows.length === 0 ? (
        <p className={shared.empty}>{NOTHING_PUBLISHED}</p>
      ) : (
        <ul className={styles.publishedList}>
          {rows.map((row) => (
            <PublishedItem key={row.studentId} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}
