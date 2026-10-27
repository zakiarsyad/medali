import { LevelBars } from "@/mental-health/level-bars";
import { LevelBadges } from "@/mental-health/screening-badges";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import board from "./dashboard.module.css";
import type { DormMental, DormPublishedRow } from "./dashboard-health-recap";
import {
  assessedLine,
  MENTAL_TOO_FEW,
  NOBODY_ASSESSED,
  NOTHING_PUBLISHED,
  PUBLISHED_HEADING,
  publishedPlaceLine,
} from "./dashboard-health-words";

function MentalCounts({ mental }: { mental: DormMental }) {
  const { recap, sessions } = mental;
  if (recap.kind === "none") {
    return <p className={shared.empty}>{NOBODY_ASSESSED}</p>;
  }
  if (recap.kind === "too_few" || sessions === null) {
    return <p className={shared.empty}>{MENTAL_TOO_FEW}</p>;
  }
  return (
    <>
      <LevelBars byLevel={recap.byLevel} />
      <p className={board.more}>{assessedLine(recap.assessed, sessions)}</p>
    </>
  );
}

/** One resident: the date, the name with the level when shared, and the room with what was shared. */
function PublishedItem({ row }: { row: DormPublishedRow }) {
  return (
    <li className={board.outItem}>
      <span className={board.when}>{DAY.format(row.publishedAt)}</span>
      <div className={board.outBody}>
        <b>{row.name}</b>{" "}
        {row.level !== null && <LevelBadges level={row.level} risk={false} />}
        <span className={shared.detail}>{publishedPlaceLine(row)}</span>
      </div>
    </li>
  );
}

function PublishedList({ rows }: { rows: readonly DormPublishedRow[] }) {
  return (
    <>
      <h3 className={board.subheading}>{PUBLISHED_HEADING}</h3>
      {rows.length === 0 ? (
        <p className={shared.empty}>{NOTHING_PUBLISHED}</p>
      ) : (
        <ul className={board.outList}>
          {rows.map((row) => (
            <PublishedItem key={row.studentId} row={row} />
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * "Kesehatan mental penghuni", rekap anonim: how many residents in reach
 * are at each level, never a name, and the residents whose data a
 * counsellor published to the account, as the server sent them.
 */
export function MentalHealthPanel({ mental }: { mental: DormMental }) {
  return (
    <section className={shared.panel}>
      <div className={board.head}>
        <h2 className={shared.heading}>Kesehatan mental penghuni</h2>
        <span className={board.sub}>rekap anonim</span>
      </div>
      <MentalCounts mental={mental} />
      <PublishedList rows={mental.published} />
    </section>
  );
}
