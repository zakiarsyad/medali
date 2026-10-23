import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { readOwnAchievement } from "./own-achievement";
import { StudentAchievementView } from "./student-achievement-view";

/**
 * "Capaian karakter" of the student of the account, for Profil saya. An
 * account without the right, or without a student record, gets nothing
 * at all.
 */
export async function OwnAchievementPanel({
  account,
}: {
  account: AccountForAccess;
}) {
  const achievement = await readOwnAchievement(
    database(),
    account,
    campusDay(),
  );
  if (achievement === null) return null;
  return <StudentAchievementView achievement={achievement} />;
}
