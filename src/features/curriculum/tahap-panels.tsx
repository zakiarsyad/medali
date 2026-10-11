"use client";

import { type ReactNode, useState } from "react";
import { MainIndicatorsPanel } from "./main-indicators-panel";
import type { ValueIndicators } from "./main-indicators";
import type { PpksActivity } from "./ppks-activities";
import type { TahapBreakdown } from "./stage-breakdown";
import { StagesSection } from "./stages-section";

/**
 * The panels that follow the chosen tahap: the main indicators mark its
 * level, and the tahap section shows its content. `children` sits between
 * the two.
 */
export function TahapPanels({
  values,
  indicatorNote,
  mayChange,
  activities,
  breakdowns,
  mayManageActivities,
  children,
}: {
  /** Every nilai with its main indicators as they are now. */
  values: ValueIndicators[];
  /** Who changed the indicators last, or that they are the starting ones. */
  indicatorNote: string;
  mayChange: boolean;
  activities: PpksActivity[];
  /** The breakdown of each of the four tahap. */
  breakdowns: TahapBreakdown[];
  mayManageActivities: boolean;
  children: ReactNode;
}) {
  const [tahapNo, setTahapNo] = useState(1);
  return (
    <>
      <MainIndicatorsPanel
        values={values}
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
        mayManage={mayManageActivities}
      />
    </>
  );
}
