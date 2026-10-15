import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { CounsellingScreen } from "@/features/counselling/counselling-screen";

export default async function CounsellingPage() {
  const { account } = await openPage("konseling");
  return (
    <CounsellingScreen
      mayManage={may(account.roles, "manage_counselling_consent")}
    />
  );
}
