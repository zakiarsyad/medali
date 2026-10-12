import {
  FILE_STORAGE_NAMES,
  hasCampusMark,
  missingGoogleSignInNames,
  type SettingName,
  type SettingsEnv,
} from "@/settings";

/**
 * The settings that would turn Ganti peran on somewhere else: one that
 * says the app is a preview, one that says it runs at the previews'
 * hosting, and one that says it is a local run. The campus mark already
 * keeps Ganti peran off; one of these on the campus server is still a
 * mistake to put right before real data is served.
 */
export function settingsToRemove(env: SettingsEnv): string[] {
  const names: string[] = [];
  const saysPreview =
    env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "production";
  if (saysPreview) names.push("VERCEL_ENV");
  if (env.VERCEL) names.push("VERCEL");
  if (env.NODE_ENV === "development") names.push("NODE_ENV");
  return names;
}

/** The names of the settings the campus server needs that are still empty. */
export function missingSettings(env: SettingsEnv): SettingName[] {
  const names: SettingName[] = ["DATABASE_URL", ...FILE_STORAGE_NAMES];
  return [
    ...names.filter((name) => !env[name]),
    ...missingGoogleSignInNames(env),
  ];
}

function missingRefusal(missing: SettingName[]): string {
  const filledFrom = missing.includes("DATABASE_URL")
    ? " In the package, DATABASE_URL is made from DATABASE_PASSWORD."
    : "";
  return `These settings are empty: ${missing.join(", ")}. Fill them in the settings file of the package.${filledFrom} The package refused to start.`;
}

/**
 * Why the campus server package may not start, one line for each reason,
 * or nothing when it may. A line names settings and never shows a value.
 */
export function startRefusals(env: SettingsEnv): string[] {
  if (!hasCampusMark(env)) {
    return [
      "The campus mark MEDALI_CAMPUS is missing. This check belongs to the campus server package, which always carries it; refused to start.",
    ];
  }
  const refusals: string[] = [];
  const toRemove = settingsToRemove(env);
  if (toRemove.length > 0) {
    refusals.push(
      `Ganti peran is never on at the campus server, but a setting here would turn it on elsewhere. Remove: ${toRemove.join(", ")}. The package refused to start.`,
    );
  }
  const missing = missingSettings(env);
  if (missing.length > 0) refusals.push(missingRefusal(missing));
  return refusals;
}
