import { LevelBadges } from "@/mental-health/screening-badges";
import type { OwnSessionSummary } from "@/mental-health/session-view";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { ConsentBadge } from "./consent-badge";
import styles from "./counselling.module.css";
import type { OwnMental } from "./own-mental";
import { OwnMentalNotices } from "./own-mental-notices";
import {
  campusContactLine,
  HELP_LINE,
  NO_SESSION_YET,
} from "./own-mental-words";
import { ScreeningLine } from "./student-mental-view";

function sessionsWords(sessions: OwnSessionSummary | null): string {
  if (sessions === null) return NO_SESSION_YET;
  return `${sessions.count} sesi, terakhir ${shownDay(sessions.lastDay)}`;
}

function CounsellingFacts({ mental }: { mental: OwnMental }) {
  const { consent, sessions } = mental;
  return (
    <dl className={styles.facts}>
      <div>
        <dt>Persetujuan konseling</dt>
        <dd>
          <ConsentBadge status={consent} />
        </dd>
      </div>
      <div>
        <dt>Sesi konseling</dt>
        <dd>{sessionsWords(sessions)}</dd>
      </div>
      {sessions?.nextDay && (
        <div>
          <dt>Sesi berikutnya</dt>
          <dd>{shownDay(sessions.nextDay)}</dd>
        </div>
      )}
    </dl>
  );
}

/**
 * "Kesehatan mental" on the student's own Profil saya: the level of the
 * latest screening with its advice, where they stand with counselling,
 * and always the line that says where to get help, with the campus
 * contact once it is set. Drawn on the server, so only these lines reach
 * the browser.
 */
export function OwnMentalView({
  mental,
  contact,
}: {
  mental: OwnMental;
  /** "Kontak konseling kampus"; empty while it is not set. */
  contact: string;
}) {
  const { screening } = mental;
  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Kesehatan mental</h2>
        {screening && (
          <span>
            <LevelBadges level={screening.level} risk={false} />
          </span>
        )}
      </div>
      <ScreeningLine screening={screening} />
      <CounsellingFacts mental={mental} />
      <OwnMentalNotices mental={mental} />
      <p className={styles.sub}>{HELP_LINE}</p>
      {contact !== "" && (
        <p className={styles.sub}>{campusContactLine(contact)}</p>
      )}
    </section>
  );
}
