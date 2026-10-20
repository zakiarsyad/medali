import { periodTitle } from "@/academic-periods/period-labels";
import {
  SURVEY_STATUS_TITLES,
  type SurveyStatus,
} from "@/mentoring/survey-status";
import shared from "@/ui/data-screen.module.css";
import styles from "./mentor-groups.module.css";
import type { RunningSurveyCard } from "./survey-card";
import { respondentWords, surveyDaysWords, weightWords } from "./survey-words";

/** Dibuka in the colour of what goes well, Terjadwal in that of what waits. */
const STATUS_STYLES: Record<SurveyStatus, string | undefined> = {
  scheduled: styles.fair,
  open: styles.good,
  ended: undefined,
  closed: undefined,
};

/**
 * "Periode evaluasi (periode)": the running survey period with its dates,
 * who opened it, its status, Responden, Bobot, and its note when it has
 * one.
 */
export function SurveyCard({ card }: { card: RunningSurveyCard }) {
  return (
    <>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>
            Periode evaluasi {periodTitle(card.period)}
          </h2>
          <p className={styles.quiet}>{surveyDaysWords(card)}</p>
        </div>
        <span className={`${shared.badge} ${STATUS_STYLES[card.status] ?? ""}`}>
          {SURVEY_STATUS_TITLES[card.status]}
        </span>
      </div>
      <dl className={styles.surveyFacts}>
        <div>
          <dt>Responden</dt>
          <dd>{respondentWords(card.answered, card.respondentPool)}</dd>
        </div>
        <div>
          <dt>Bobot</dt>
          <dd>{weightWords(card.achievementWeight)}</dd>
        </div>
        {card.note !== null && (
          <div className={styles.whole}>
            <dt>Keterangan</dt>
            <dd>{card.note}</dd>
          </div>
        )}
      </dl>
    </>
  );
}
