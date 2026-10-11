import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { CurriculumScreen } from "@/features/curriculum/curriculum-screen";

export default async function CurriculumPage() {
  const opened = await openPage("kurikulum");
  const { roles } = opened.account;
  return (
    <CurriculumScreen
      mayChange={may(roles, "change_curriculum")}
      mayManageActivities={may(roles, "manage_activities")}
    />
  );
}
