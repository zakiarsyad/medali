import {
  missingGoogleSignInNames,
  type SettingsEnv,
  stageOf,
} from "@/settings";
import { accountSwitcherOn } from "./account-switcher";

/**
 * Refuses to start where sign-in with Google is the only way in and its
 * settings are not all filled: nobody could get in, and nothing would say
 * why. The message names the empty settings and never shows a value.
 */
export function checkSignInAtStartup(env: SettingsEnv): void {
  if (accountSwitcherOn(stageOf(env))) return;
  const missing = missingGoogleSignInNames(env);
  if (missing.length === 0) return;
  throw new Error(
    `Sign-in with Google is the only way in here, but these settings are empty: ${missing.join(", ")}; refused to start.`,
  );
}
