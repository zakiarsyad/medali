import type { OwnSessionSummary } from "@/mental-health/session-view";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import styles from "./counselling.module.css";

/**
 * What the student sees of their own counselling sessions: how many,
 * the day of the latest, and the next session when one is set. Never
 * the notes. Not shown while there is none.
 */
export function OwnSessionSummaryBox({
  summary,
}: {
  summary: OwnSessionSummary | null;
}) {
  if (summary === null) return null;
  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <p>
        <b>Sesi konseling:</b> {summary.count} sesi, terakhir{" "}
        {shownDay(summary.lastDay)}
      </p>
      {summary.nextDay && (
        <p>
          <b>Sesi berikutnya:</b> {shownDay(summary.nextDay)}
        </p>
      )}
    </section>
  );
}
