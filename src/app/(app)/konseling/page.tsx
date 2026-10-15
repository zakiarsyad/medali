import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readOwnConsent } from "@/features/counselling/consent-reads";
import { CounsellingScreen } from "@/features/counselling/counselling-screen";

export default async function CounsellingPage() {
  const { account } = await openPage("konseling");
  const { roles } = account;
  const answersOwn = may(roles, "answer_own_counselling_consent");
  const own = answersOwn
    ? { consent: await readOwnConsent(database(), account) }
    : null;
  return (
    <CounsellingScreen
      own={own}
      mayManage={may(roles, "manage_counselling_consent")}
    />
  );
}
