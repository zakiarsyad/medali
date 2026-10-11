import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { CurriculumScreen } from "@/features/curriculum/curriculum-screen";

export default async function CurriculumPage() {
  const opened = await openPage("kurikulum");
  return (
    <CurriculumScreen
      mayChange={may(opened.account.roles, "change_curriculum")}
    />
  );
}
