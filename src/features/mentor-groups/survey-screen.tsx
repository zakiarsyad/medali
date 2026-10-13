import { MentorsHead } from "@/ui/mentors-head";
import type { TabLinksProps } from "@/ui/tab-links";
import { SurveyPanel } from "./survey-panel";
import type { SurveyRights } from "./survey-rights";
import { SurveyArea } from "./survey-tab";

/** The tab "Evaluasi oleh mahasiswa". */
export function SurveyScreen({
  tabs,
  rights,
}: {
  tabs: TabLinksProps;
  /** What the account that opened the tab may do and count there. */
  rights: SurveyRights;
}) {
  return (
    <>
      <MentorsHead tabs={tabs} />
      <SurveyArea
        mayManage={rights.mayManage}
        panel={<SurveyPanel rights={rights} />}
      />
    </>
  );
}
