import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readOwnSanction } from "@/discipline-penalties/read-sanctions";
import { OwnAchievementPanel } from "@/features/character-assessment/own-achievement-panel";
import { OwnScoreHistoryPanel } from "@/features/character-assessment/own-score-history-panel";
import { OwnGradePanel } from "@/features/character-grades/own-grade-panel";
import { OwnMentalPanel } from "@/features/counselling/own-mental-panel";
import { readBaseScore } from "@/features/curriculum/stored-base-score";
import { OwnFitnessPanel } from "@/features/fitness/own-fitness-panel";
import { OwnCoachingPanel } from "@/features/guidance/own-coaching-panel";
import { OwnPenaltiesPanel } from "@/features/guidance/own-penalties-panel";
import { OwnNotesPanel } from "@/features/mentoring/own-notes-panel";
import { ProfileSikuPanel } from "@/features/siku/profile-siku-panel";
import { readOwnProfile } from "@/features/students/own-profile";
import { OwnProfileScreen } from "@/features/students/own-profile-screen";
import { readOwnSurvey } from "@/features/students/own-survey";
import { runningPeriodNow } from "@/features/students/running-period-now";

export default async function OwnProfilePage() {
  const { account } = await openPage("saya");
  const period = await runningPeriodNow();
  const [answer, survey, sanction] = await Promise.all([
    readOwnProfile(database(), account, period),
    readOwnSurvey(database(), account, campusDay()),
    readOwnSanction(database(), account),
  ]);
  if (answer.kind === "refused") forbidden();
  // Only an Aktif student has a SIKU that counts in a grade now.
  const isActive = answer.student.status === "active";
  return (
    <OwnProfileScreen
      student={answer.student}
      period={period}
      survey={survey}
      sanction={sanction}
      morePanels={
        <>
          <OwnAchievementPanel account={account} />
          <OwnGradePanel account={account} />
          {isActive && (
            <ProfileSikuPanel
              account={account}
              base={readBaseScore(database()).then(({ score }) => score)}
            />
          )}
          <OwnPenaltiesPanel account={account} />
          <OwnScoreHistoryPanel account={account} />
          <OwnCoachingPanel account={account} />
          <OwnNotesPanel account={account} />
          <OwnFitnessPanel account={account} />
          <OwnMentalPanel account={account} />
        </>
      }
    />
  );
}
