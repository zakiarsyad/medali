import { checkSwitcherAtStartup } from "@/auth/account-switcher";

/** Runs once when the app starts. */
export function register(): void {
  checkSwitcherAtStartup(process.env);
}
