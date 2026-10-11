/** The settings that come from outside the repo. `.env.example` lists them. */
export const SETTING_NAMES = ["DATABASE_URL"] as const;

export type SettingName = (typeof SETTING_NAMES)[number];

export function readSetting(name: SettingName): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `The setting ${name} is missing. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

/**
 * Where the app runs. Vercel names its environments: `production` is the
 * preview of `main`, and `preview` is a PR preview. A local computer says
 * so with NODE_ENV=development. Anything without such a clear yes is
 * treated as the campus server, where real data lives.
 */
export type Stage = "local" | "pr-preview" | "main-preview" | "campus";

interface StageEnv {
  NODE_ENV?: string | undefined;
  VERCEL_ENV?: string | undefined;
}

export function stageOf(env: StageEnv): Stage {
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
