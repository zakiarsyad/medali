"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentStage, readGoogleSignInSettings } from "@/settings";
import type { FormState } from "@/ui/form-message";
import { appOriginOf } from "./app-origin";
import {
  ATTEMPT_SECONDS,
  attemptCookieName,
  attemptCookieValue,
  googleSignInAddress,
  newSignInAttempt,
  RETURN_PATH,
} from "./sign-in-attempt";
import { signInCookieOptions } from "./sign-in-cookies";

function refused(error: string): FormState {
  return { error, done: null };
}

/** Sends the person to Google's page, to come back with their address. */
export async function startGoogleSignIn(
  _before: FormState,
  _form: FormData,
): Promise<FormState> {
  const settings = readGoogleSignInSettings();
  if (!settings) return refused("Masuk dengan Google belum diatur.");
  const stage = currentStage();
  const sent = await headers();
  const origin = appOriginOf((name) => sent.get(name), stage);
  if (!origin) return refused("Masuk dengan Google gagal. Coba lagi.");

  const attempt = newSignInAttempt();
  (await cookies()).set(
    attemptCookieName(attempt.state, stage),
    attemptCookieValue(attempt),
    {
      ...signInCookieOptions(stage),
      maxAge: ATTEMPT_SECONDS,
    },
  );
  redirect(googleSignInAddress(settings, attempt, `${origin}${RETURN_PATH}`));
}
