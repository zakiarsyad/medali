import { campusDay } from "@/academic-periods/campus-day";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import styles from "./mentor-groups.module.css";
import { readRunningSurveyCard } from "./survey-card";
import { SurveyCard } from "./survey-card-view";
import { SurveyControls } from "./survey-controls";
import { readSurveyFormStart } from "./survey-form-reads";
import type { SurveyFormStart } from "./survey-form-start";
import { SurveyOpenForm } from "./survey-open-form";
import type { SurveyRights } from "./survey-rights";
import { SurveySaidAbove } from "./survey-said";

function OpenPart({ start }: { start: SurveyFormStart }) {
  return (
    <>
      <h2 className={shared.heading}>Buka periode evaluasi pengasuhan</h2>
      <p className={styles.quiet}>
        Selama periode dibuka, mahasiswa mengisi survei kepuasan terhadap
        pengasuhnya di Profil saya.
      </p>
      <SurveyOpenForm start={start} />
    </>
  );
}

/**
 * The panel of the survey period: the card of the one that runs, with
 * what may be done with it for an account that may manage them, or,
 * while none runs, the form that opens one for such an account. What it
 * shows is read at the same time.
 */
export async function SurveyPanel({ rights }: { rights: SurveyRights }) {
  const db = database();
  const today = campusDay();
  const [card, start] = await Promise.all([
    readRunningSurveyCard(db, rights.respondents, today),
    rights.mayManage ? readSurveyFormStart(db, today) : null,
  ]);
  if (card === null && start === null) return null;
  return (
    <section className={shared.panel}>
      {/* The same part around the card and the form, so what it says stays when one gives way to the other. */}
      <SurveySaidAbove>
        {card !== null && <SurveyCard card={card} />}
        {card !== null && rights.mayManage && (
          <SurveyControls
            periodId={card.id}
            startsOn={card.startsOn}
            endsOn={card.endsOn}
          />
        )}
        {card === null && start !== null && <OpenPart start={start} />}
      </SurveySaidAbove>
    </section>
  );
}
