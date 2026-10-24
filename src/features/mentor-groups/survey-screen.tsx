import { MentorsHead } from "@/ui/mentors-head";
import type { TabLinksProps } from "@/ui/tab-links";
import { SurveyPanel } from "./survey-panel";
import type { SurveyResultChoices } from "./survey-results-address";
import { SurveyResultsPanel } from "./survey-results-panel";
import type { SurveyRights } from "./survey-rights";
import { SurveyArea, SurveyNote } from "./survey-tab";

/**
 * The tab "Evaluasi oleh mahasiswa": the panel of the survey period, and
 * under it "Hasil evaluasi per kelompok" for an account that may read it.
 */
export function SurveyScreen({
  tabs,
  rights,
  choices,
}: {
  tabs: TabLinksProps;
  /** What the account that opened the tab may do and count there. */
  rights: SurveyRights;
  /** What the address asks "Hasil evaluasi per kelompok" for. */
  choices: SurveyResultChoices;
}) {
  return (
    <>
      <MentorsHead tabs={tabs}>
        <SurveyNote mayManage={rights.mayManage} />
      </MentorsHead>
      <SurveyArea panel={<SurveyPanel rights={rights} />} />
      {rights.results !== null && (
        <SurveyResultsPanel
          limit={rights.results}
          choices={choices}
          mayFix={rights.mayFix}
        />
      )}
    </>
  );
}
