import { forbidden, redirect } from "next/navigation";
import { currentStage, type Stage } from "@/settings";
import { accountSwitcherOn } from "./account-switcher";
import { SIGN_IN_PATH } from "./sign-in-messages";

/**
 * What a page answers when nobody is signed in. Where sign-in is the only
 * way in, it is the sign-in page. Where "Ganti peran" is on there is
 * always an account unless the sample data is missing, and the page is
 * refused as before.
 */
export function answerToNobody(stage: Stage): "sign-in" | "refused" {
  return accountSwitcherOn(stage) ? "refused" : "sign-in";
}

/** Ends a page that was opened by nobody. */
export function askToSignIn(): never {
  if (answerToNobody(currentStage()) === "sign-in") redirect(SIGN_IN_PATH);
  forbidden();
}
