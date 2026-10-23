import Link from "next/link";
import type {
  PublishedMental,
  PublishedRow,
} from "@/mental-health/mental-recap";
import { publishedLine } from "@/mental-health/published-words";
import { LevelBadges } from "@/mental-health/screening-badges";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import styles from "./dashboard.module.css";
import { NOTHING_PUBLISHED } from "./mental-words";

/** One student: the date, the name with the level when shared, and the line under it. */
function PublishedItem({
  row,
  namesMentor,
}: {
  row: PublishedRow;
  namesMentor: boolean;
}) {
  const line = publishedLine(row, namesMentor);
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
 * mental, for an account that may open it. Dashboard anak asuh gives it
 * its own title and empty line, and leaves out the Pengasuh, who is the
 * reader.
 */
export function PublishedPanel({
  published,
  detailAddress,
  title = "Data kesehatan mental yang dipublikasikan",
  emptyWords = NOTHING_PUBLISHED,
  namesMentor = true,
}: {
  published: PublishedMental | null;
  detailAddress: string | null;
  title?: string;
  emptyWords?: string;
  namesMentor?: boolean;
}) {
  const rows = published?.rows ?? [];
  return (
    <div className={shared.panel}>
      <div className={styles.panelHead}>
        <h3 className={shared.heading}>{title}</h3>
        {detailAddress !== null && (
          <Link href={detailAddress} className={shared.quiet}>
            Lihat rincian
          </Link>
        )}
      </div>
      {rows.length === 0 ? (
        <p className={shared.empty}>{emptyWords}</p>
      ) : (
        <ul className={styles.publishedList}>
          {rows.map((row) => (
            <PublishedItem
              key={row.studentId}
              row={row}
              namesMentor={namesMentor}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
