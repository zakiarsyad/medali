import { MentorsHead } from "@/ui/mentors-head";
import type { TabLinksProps } from "@/ui/tab-links";
import styles from "./mentor-groups.module.css";
import { SurveyComponents } from "./survey-components";
import { SurveyPanel } from "./survey-panel";
import type { SurveyRights } from "./survey-rights";

/**
 * The tab "Evaluasi oleh mahasiswa": the panel of the survey period
 * beside "Komponen evaluasi pengasuhan", and one under the other where
 * they do not fit.
 */
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
      <div className={styles.sideBySide}>
        <SurveyPanel rights={rights} />
        <SurveyComponents />
      </div>
    </>
  );
}
