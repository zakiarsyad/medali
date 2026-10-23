import { openPage } from "@/auth/open-page";
import { readSurveyResultParams } from "@/features/mentor-groups/survey-results-address";
import { surveyRightsFor } from "@/features/mentor-groups/survey-rights";
import { SurveyScreen } from "@/features/mentor-groups/survey-screen";

export default async function StudentSurveyPage(
  props: PageProps<"/pengasuh/survei">,
) {
  const opened = await openPage("pengasuh", "survei");
  const params = await props.searchParams;
  return (
    <SurveyScreen
      tabs={{ pagePath: "pengasuh", tabs: opened.tabs, open: "survei" }}
      rights={surveyRightsFor(opened.account)}
      choices={readSurveyResultParams(params)}
    />
  );
}
