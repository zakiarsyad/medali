/** The settings that come from outside the repo. `.env.example` lists them. */
export const SETTING_NAMES = [
  "DATABASE_URL",
  "TEST_DATABASE_URL",
  "FILE_STORAGE_URL",
  "FILE_STORAGE_BUCKET",
  "FILE_STORAGE_ACCESS_KEY",
  "FILE_STORAGE_SECRET_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "CAMPUS_EMAIL_ENDING",
  "CAMPUS_COUNSELLING_CONTACT",
] as const;

export type SettingName = (typeof SETTING_NAMES)[number];

export type SettingsEnv = Readonly<Record<string, string | undefined>>;

function settingIn(env: SettingsEnv, name: SettingName): string {
  const value = env[name];
  if (!value) {
    throw new Error(
      `The setting ${name} is missing. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export function readSetting(name: SettingName): string {
  return settingIn(process.env, name);
}

/** How to reach the file storage: MinIO, or a service that works like it. */
export interface FileStorageSettings {
  url: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
}

export const FILE_STORAGE_NAMES = [
  "FILE_STORAGE_URL",
  "FILE_STORAGE_BUCKET",
  "FILE_STORAGE_ACCESS_KEY",
  "FILE_STORAGE_SECRET_KEY",
] as const satisfies readonly SettingName[];

function isPreview(stage: Stage): boolean {
  return stage === "pr-preview" || stage === "main-preview";
}

/**
 * The four settings of the file storage, or null where file keeping is
 * off: a preview with all four empty, until the owner fills them in.
 * Anywhere else an empty setting is an error, as for the database. So is
 * a setup that is only partly filled, on a preview too: it is a mistake,
 * and silently keeping no file would hide it.
 */
export function fileStorageSettingsOf(
  env: SettingsEnv,
  stage: Stage,
): FileStorageSettings | null {
  const allEmpty = FILE_STORAGE_NAMES.every((name) => !env[name]);
  if (allEmpty && isPreview(stage)) return null;
  return {
    url: settingIn(env, "FILE_STORAGE_URL"),
    bucket: settingIn(env, "FILE_STORAGE_BUCKET"),
    accessKey: settingIn(env, "FILE_STORAGE_ACCESS_KEY"),
    secretKey: settingIn(env, "FILE_STORAGE_SECRET_KEY"),
  };
}

export function readFileStorageSettings(): FileStorageSettings | null {
  return fileStorageSettingsOf(process.env, currentStage());
}

/**
 * The campus address ending as it is compared: in small letters, starting
 * with "@". Empty while the setting is not filled in.
 */
export function campusEmailEndingOf(env: SettingsEnv): string {
  const written = (env.CAMPUS_EMAIL_ENDING ?? "").trim().toLowerCase();
  const domain = written.startsWith("@") ? written.slice(1) : written;
  return domain === "" ? "" : `@${domain}`;
}

export function readCampusEmailEnding(): string {
  return campusEmailEndingOf(process.env);
}

/**
 * "Kontak konseling kampus" as the student reads it under the help line,
 * such as a phone number or a room. Empty while the setting is not
 * filled in, and then nothing more shows.
 */
export function campusCounsellingContactOf(env: SettingsEnv): string {
  return (env.CAMPUS_COUNSELLING_CONTACT ?? "").trim();
}

export function readCampusCounsellingContact(): string {
  return campusCounsellingContactOf(process.env);
}

/** What sign-in with Google needs: the two Google keys and the ending. */
export interface GoogleSignInSettings {
  clientId: string;
  clientSecret: string;
  campusEnding: string;
}

/**
 * The settings of sign-in with Google, or null while Google sign-in is
 * off: any of the three is empty. With only some filled it stays off, so
 * nobody is sent to Google with half a setup.
 */
export function googleSignInSettingsOf(
  env: SettingsEnv,
): GoogleSignInSettings | null {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const campusEnding = campusEmailEndingOf(env);
  if (!clientId || !clientSecret || campusEnding === "") return null;
  return { clientId, clientSecret, campusEnding };
}

/** The names of the Google sign-in settings that are still empty. */
export function missingGoogleSignInNames(env: SettingsEnv): SettingName[] {
  const missing: SettingName[] = [];
  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (campusEmailEndingOf(env) === "") missing.push("CAMPUS_EMAIL_ENDING");
  return missing;
}

export function readGoogleSignInSettings(): GoogleSignInSettings | null {
  return googleSignInSettingsOf(process.env);
}

/**
 * Where the app runs. Vercel names its environments: `production` is the
 * preview of `main`, and `preview` is a PR preview. A local computer says
 * so with NODE_ENV=development. Anything without such a clear yes is
 * treated as the campus server, where real data lives. The campus mark
 * wins over all of them.
 */
export type Stage = "local" | "pr-preview" | "main-preview" | "campus";

interface StageEnv {
  NODE_ENV?: string | undefined;
  VERCEL_ENV?: string | undefined;
  MEDALI_CAMPUS?: string | undefined;
}

/**
 * Whether the campus mark is there. The campus server package sets it
 * when it is built. It counts whatever it holds, so a setting on the
 * server can give it another value but cannot switch it off.
 */
export function hasCampusMark(env: StageEnv): boolean {
  return env.MEDALI_CAMPUS !== undefined;
}

export function stageOf(env: StageEnv): Stage {
  if (hasCampusMark(env)) return "campus";
  if (env.VERCEL_ENV === "preview") return "pr-preview";
  if (env.VERCEL_ENV === "production") return "main-preview";
  const onVercelOrNowhere =
    env.VERCEL_ENV === undefined || env.VERCEL_ENV === "development";
  if (env.NODE_ENV === "development" && onVercelOrNowhere) return "local";
  return "campus";
}

export function currentStage(): Stage {
  return stageOf(process.env);
}

/** The branch a Vercel build was made from, when Vercel says so. */
export function deployBranch(): string | undefined {
  return process.env.VERCEL_GIT_COMMIT_REF || undefined;
}
