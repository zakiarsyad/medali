import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readOwnProfile } from "@/features/students/own-profile";
import { OwnProfileScreen } from "@/features/students/own-profile-screen";
import { runningPeriodNow } from "@/features/students/running-period-now";

export default async function OwnProfilePage() {
  const { account } = await openPage("saya");
  const [answer, period] = await Promise.all([
    readOwnProfile(database(), account),
    runningPeriodNow(),
  ]);
  if (answer.kind === "refused") forbidden();
  return <OwnProfileScreen student={answer.student} period={period} />;
}
