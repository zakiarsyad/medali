import { campusDay } from "@/academic-periods/campus-day";
import { database } from "@/db/database";
import { readRunningSurveyPeriod } from "@/mentoring/running-survey-period";
import shared from "@/ui/data-screen.module.css";
import styles from "./mentor-groups.module.css";
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
 * The panel of the survey period: the form that opens one while none
 * runs, for an account that may manage them. What it shows is read at
 * the same time.
 */
export async function SurveyPanel({ rights }: { rights: SurveyRights }) {
  const db = database();
  const today = campusDay();
  const [running, start] = await Promise.all([
    readRunningSurveyPeriod(db, today),
    rights.mayManage ? readSurveyFormStart(db, today) : null,
  ]);
  if (running !== null || start === null) return null;
  return (
    <section className={shared.panel}>
      <SurveySaidAbove>
        <OpenPart start={start} />
      </SurveySaidAbove>
    </section>
  );
}
