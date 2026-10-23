import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { OwnAchievementPanel } from "@/features/character-assessment/own-achievement-panel";
import { OwnScoreHistoryPanel } from "@/features/character-assessment/own-score-history-panel";
import { readOwnProfile } from "@/features/students/own-profile";
import { OwnProfileScreen } from "@/features/students/own-profile-screen";
import { readOwnSurvey } from "@/features/students/own-survey";
import { runningPeriodNow } from "@/features/students/running-period-now";

export default async function OwnProfilePage() {
  const { account } = await openPage("saya");
  const period = await runningPeriodNow();
  const [answer, survey] = await Promise.all([
    readOwnProfile(database(), account, period),
    readOwnSurvey(database(), account, campusDay()),
  ]);
  if (answer.kind === "refused") forbidden();
  return (
    <OwnProfileScreen
      student={answer.student}
      period={period}
      survey={survey}
      morePanels={
        <>
          <OwnAchievementPanel account={account} />
          <OwnScoreHistoryPanel account={account} />
        </>
      }
    />
  );
}
