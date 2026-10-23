import { LevelBars } from "@/mental-health/level-bars";
import shared from "@/ui/data-screen.module.css";
import board from "./dashboard.module.css";
import type { DormMental } from "./dashboard-health-recap";
import {
  assessedLine,
  MENTAL_TOO_FEW,
  NOBODY_ASSESSED,
} from "./dashboard-health-words";

function MentalCounts({ mental }: { mental: DormMental }) {
  const { recap, sessions } = mental;
  if (recap.kind === "none") {
    return <p className={board.none}>{NOBODY_ASSESSED}</p>;
  }
  if (recap.kind === "too_few" || sessions === null) {
    return <p className={board.none}>{MENTAL_TOO_FEW}</p>;
  }
  return (
    <>
      <LevelBars byLevel={recap.byLevel} />
      <p className={board.more}>{assessedLine(recap.assessed, sessions)}</p>
    </>
  );
}

/**
 * "Kesehatan mental penghuni", rekap anonim: how many residents in reach
 * are at each level, never a name, as the server sent them.
 */
export function MentalHealthPanel({ mental }: { mental: DormMental }) {
  return (
    <section className={shared.panel}>
      <div className={board.head}>
        <h2 className={shared.heading}>Kesehatan mental penghuni</h2>
        <span className={board.sub}>rekap anonim</span>
      </div>
      <MentalCounts mental={mental} />
    </section>
  );
}
