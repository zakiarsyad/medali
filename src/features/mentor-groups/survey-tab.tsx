import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./mentor-groups.module.css";
import type { RunningSurveyCard } from "./survey-card";
import { SurveyCard } from "./survey-card-view";
import { SurveyComponents } from "./survey-components";
import { SurveyControls } from "./survey-controls";
import type { SurveyFormStart } from "./survey-form-start";
import { SurveyOpenForm } from "./survey-open-form";
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

/** The running period with its buttons, or the form that opens one. */
function ManagedPart({
  card,
  start,
}: {
  card: RunningSurveyCard | null;
  start: SurveyFormStart | null;
}) {
  if (card !== null) {
    return (
      <>
        <SurveyCard card={card} />
        <SurveyControls
          periodId={card.id}
          startsOn={card.startsOn}
          endsOn={card.endsOn}
        />
      </>
    );
  }
  if (start === null) return null;
  return <OpenPart start={start} />;
}

/**
 * The panel of the survey period. An account that only reads gets the
 * card of the period that runs, without a button, and no panel while
 * none runs. An account that may manage the periods gets the card with
 * its buttons, or the form that opens a period.
 */
export function SurveyPanelBody({
  card,
  start,
  mayManage,
}: {
  /** The period that runs, or null. */
  card: RunningSurveyCard | null;
  /** What the form opens with, or null for an account that gets no form. */
  start: SurveyFormStart | null;
  mayManage: boolean;
}) {
  if (!mayManage) {
    if (card === null) return null;
    return (
      <section className={shared.panel}>
        <SurveyCard card={card} />
      </section>
    );
  }
  return (
    <section className={shared.panel}>
      {/* The same part around the card and the form, so what it says stays when one gives way to the other. */}
      <SurveySaidAbove>
        <ManagedPart card={card} start={start} />
      </SurveySaidAbove>
    </section>
  );
}

/**
 * The tab under its head: the panel of the survey period beside
 * "Komponen evaluasi pengasuhan", and one under the other where they do
 * not fit. An account that only reads is told first who opens a period.
 */
export function SurveyArea({
  mayManage,
  panel,
}: {
  mayManage: boolean;
  panel: ReactNode;
}) {
  return (
    <>
      {!mayManage && (
        <p className={styles.note}>
          Periode evaluasi pengasuhan dibuka oleh Kepala Unit Pembangunan
          Karakter.
        </p>
      )}
      <div className={styles.sideBySide}>
        {panel}
        <SurveyComponents />
      </div>
    </>
  );
}
