import { openPage } from "@/auth/open-page";
import { surveyRightsFor } from "@/features/mentor-groups/survey-rights";
import { SurveyScreen } from "@/features/mentor-groups/survey-screen";

export default async function StudentSurveyPage() {
  const opened = await openPage("pengasuh", "survei");
  return (
    <SurveyScreen
      tabs={{ pagePath: "pengasuh", tabs: opened.tabs, open: "survei" }}
      rights={surveyRightsFor(opened.account)}
    />
  );
}
