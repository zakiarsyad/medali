import { databaseAddressRefusal } from "@/db/database-address";
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

const LETTERS_AND_DIGITS = /^[A-Za-z0-9]+$/;

/**
 * Why the database cannot be reached as its settings are written, or
 * null when it can. The package makes the database's address from the
 * password, and any other character than a letter or a digit could break
 * that address: the database would be made with the password, and the app
 * could never reach it.
 */
export function databaseSettingRefusal(env: SettingsEnv): string | null {
  const password = env.DATABASE_PASSWORD;
  if (password && !LETTERS_AND_DIGITS.test(password)) {
    return "The setting DATABASE_PASSWORD must be letters and digits only, because it becomes part of the database's address. Change it in the settings file of the package.";
  }
  // An empty address is already named with the settings that are missing.
  if (!env.DATABASE_URL) return null;
  return databaseAddressRefusal(env);
}

/** The shortest keys the file storage, MinIO, starts with. */
const SHORTEST_FILE_STORAGE_KEYS = [
  ["FILE_STORAGE_ACCESS_KEY", 3],
  ["FILE_STORAGE_SECRET_KEY", 8],
] as const;

/**
 * One line for each file storage key that is too short. With one, the
 * file storage would stop long after this check, and say why only in its
 * own log. An empty key is already named with the settings that are
 * missing.
 */
export function shortFileStorageKeys(env: SettingsEnv): string[] {
  const refusals: string[] = [];
  for (const [name, shortest] of SHORTEST_FILE_STORAGE_KEYS) {
    const key = env[name];
    if (!key || key.length >= shortest) continue;
    refusals.push(
      `The setting ${name} must be at least ${shortest} characters, or the file storage does not start. Change it in the settings file of the package.`,
    );
  }
  return refusals;
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
  const unusable = databaseSettingRefusal(env);
  if (unusable) refusals.push(`${unusable} The package refused to start.`);
  for (const tooShort of shortFileStorageKeys(env)) {
    refusals.push(`${tooShort} The package refused to start.`);
  }
  return refusals;
}
