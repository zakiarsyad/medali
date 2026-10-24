import { redirect } from "next/navigation";
import { firstPageFor } from "@/auth/access";
import { answerToNobody } from "@/auth/ask-to-sign-in";
import { currentAccount } from "@/auth/current-account";
import { SIGN_IN_PATH } from "@/auth/sign-in-messages";
import { currentStage } from "@/settings";
import { Notice } from "@/ui/notice";

export default async function HomePage() {
  const account = await currentAccount();
  const first = account ? firstPageFor(account.roles) : undefined;
  if (first) redirect(`/${first.path}`);
  if (!account && answerToNobody(currentStage()) === "sign-in") {
    redirect(SIGN_IN_PATH);
  }
  return (
    <Notice title="Belum masuk">
      Belum ada akun yang masuk. Masuk dengan akun kampus untuk membuka menu.
    </Notice>
  );
}
