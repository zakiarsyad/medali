import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { database } from "@/db/database";
import { currentStage, readGoogleSignInSettings } from "@/settings";
import { appOriginOf } from "./app-origin";
import { finishSignIn, type SignInSetup } from "./finish-sign-in";
import { googleOf } from "./google";
import { SESSION_COOKIE } from "./session-token";
import {
  ATTEMPT_COOKIE_PATH,
  attemptCookieName,
  googleCodeIn,
  isAttemptState,
  RETURN_PATH,
  readSignInAttempt,
  type SignInAttempt,
} from "./sign-in-attempt";
import { signInCookieOptions } from "./sign-in-cookies";
import { refusalAddress } from "./sign-in-messages";

/** The attempt kept for a state. Its cookie is removed: it is used once. */
async function takeAttempt(state: string): Promise<SignInAttempt | null> {
  if (!isAttemptState(state)) return null;
  const jar = await cookies();
  const name = attemptCookieName(state);
  const attempt = readSignInAttempt(state, jar.get(name)?.value);
  jar.delete({ name, path: ATTEMPT_COOKIE_PATH });
  return attempt;
}

function signInSetup(): SignInSetup {
  const settings = readGoogleSignInSettings();
  if (!settings) return null;
  return { google: googleOf(settings), campusEnding: settings.campusEnding };
}

/**
 * Answers the address Google sends the person back to: signs them in and
 * opens the app, or opens the sign-in page with the reason. Everything in
 * the address comes from outside, and where the person goes next is
 * always an address written here.
 */
export async function returnFromGoogle(request: Request): Promise<never> {
  const stage = currentStage();
  const sent = new URL(request.url).searchParams;
  const origin = appOriginOf((name) => request.headers.get(name), stage);
  const finished = await finishSignIn(
    database(),
    signInSetup(),
    {
      code: googleCodeIn(sent),
      attempt: await takeAttempt(sent.get("state") ?? ""),
      returnAddress: origin ? `${origin}${RETURN_PATH}` : null,
    },
    new Date(),
  );
  if (finished.result !== "signed_in") {
    redirect(refusalAddress(finished.result));
  }

  // No lifetime is set, so the browser forgets the cookie when it closes.
  (await cookies()).set(SESSION_COOKIE, finished.sessionToken, {
    ...signInCookieOptions(stage),
    path: "/",
  });
  redirect("/");
}
