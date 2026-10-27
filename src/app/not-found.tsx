import { redirect } from "next/navigation";
import { answerToNobody } from "@/auth/ask-to-sign-in";
import { currentAccount } from "@/auth/current-account";
import { SIGN_IN_PATH } from "@/auth/sign-in-messages";
import { currentStage } from "@/settings";
import { AddressNotFound } from "@/ui/address-not-found";
import { BareScreen } from "@/ui/bare-screen";

/**
 * Answers a "not found" that no screen inside the app's frame answers.
 * Someone who is not signed in is sent to the sign-in page first, and so
 * learns nothing of which addresses exist.
 */
export default async function NotFound() {
  const account = await currentAccount();
  if (!account && answerToNobody(currentStage()) === "sign-in") {
    redirect(SIGN_IN_PATH);
  }
  return (
    <BareScreen>
      <AddressNotFound />
    </BareScreen>
  );
}
