"use client";

import { type ReactNode, useState } from "react";
import type { ValueIndicators } from "./main-indicators";
import { MainIndicatorsPanel } from "./main-indicators-panel";
import type { PpksActivity } from "./ppks-activities";
import type { TahapBreakdown } from "./stage-breakdown";
import { StagesSection } from "./stages-section";
import type { SemesterCounts } from "./student-numbers";
import type { TahapScores } from "./tahap-scores";

/**
 * The panels that follow the chosen tahap: the main indicators mark its
 * level, and the tahap section shows its content. `children` sits between
 * the two.
 */
export function TahapPanels({
  values,
  indicatorsVersion,
  indicatorNote,
  mayChange,
  activities,
  breakdowns,
  mayManageActivities,
  newActivityId,
  semesterCounts,
  scores,
  children,
}: {
  /** Every nilai with its main indicators as they are now. */
  values: ValueIndicators[];
  /** The version of `values`, sent back by the form that changes them. */
  indicatorsVersion: string;
  /** Who changed the indicators last, or that they are the starting ones. */
  indicatorNote: string;
  mayChange: boolean;
  activities: PpksActivity[];
  /** The breakdown of each of the four tahap. */
  breakdowns: TahapBreakdown[];
  mayManageActivities: boolean;
  /**
   * The key for the next activity a form adds. The page makes a new one
   * each time it is read, so also after every save.
   */
  newActivityId: string;
  /** The active students of every program in each semester. */
  semesterCounts: SemesterCounts;
  /** The averages of the viewer's assessed students in each tahap. */
  scores: readonly (TahapScores | null)[];
  children: ReactNode;
}) {
  const [tahapNo, setTahapNo] = useState(1);
  return (
    <>
      <MainIndicatorsPanel
        values={values}
        version={indicatorsVersion}
        level={tahapNo}
        note={indicatorNote}
        mayChange={mayChange}
      />
      {children}
      <StagesSection
        tahapNo={tahapNo}
        onChoose={setTahapNo}
        activities={activities}
        breakdowns={breakdowns}
        values={values}
        mayChange={mayChange}
        mayManage={mayManageActivities}
        newActivityId={newActivityId}
        semesterCounts={semesterCounts}
        scores={scores}
      />
    </>
  );
}
