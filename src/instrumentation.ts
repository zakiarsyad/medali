import { checkSwitcherAtStartup } from "@/auth/account-switcher";
import { checkSignInAtStartup } from "@/auth/sign-in-startup";

/** Runs once when the app starts. */
export function register(): void {
  checkSwitcherAtStartup(process.env);
  checkSignInAtStartup(process.env);
}
