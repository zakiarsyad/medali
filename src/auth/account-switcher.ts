import { type Stage, stageOf } from "@/settings";

const SAMPLE_DATA_STAGES: readonly Stage[] = [
  "local",
  "pr-preview",
  "main-preview",
];

/**
 * "Ganti peran" lets anyone act as any account, so it exists only where the
 * data is sample data: locally and on the previews.
 */
export function accountSwitcherOn(stage: Stage): boolean {
  return SAMPLE_DATA_STAGES.includes(stage);
}

interface StartupEnv {
  NODE_ENV?: string | undefined;
  VERCEL_ENV?: string | undefined;
  VERCEL?: string | undefined;
  DATABASE_URL?: string | undefined;
}

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

function pointsAtThisComputer(url: string | undefined): boolean {
  if (!url || !URL.canParse(url)) return false;
  return LOCAL_HOSTS.includes(new URL(url).hostname);
}

/**
 * Refuses to start with Ganti peran on unless a second sign agrees with the
 * stage: a preview must really run on Vercel, and a local run must use a
 * database on this computer. Otherwise a stray setting on the campus server
 * could open every account to anyone.
 */
export function checkSwitcherAtStartup(env: StartupEnv): void {
  const stage = stageOf(env);
  if (!accountSwitcherOn(stage)) return;
  const isPreview = stage === "pr-preview" || stage === "main-preview";
  if (isPreview && env.VERCEL !== "1") {
    throw new Error(
      `Ganti peran is on for ${stage}, but the app is not running on Vercel; refused to start.`,
    );
  }
  if (stage === "local" && !pointsAtThisComputer(env.DATABASE_URL)) {
    throw new Error(
      "Ganti peran is on for a local run, but the database is not on this computer; refused to start.",
    );
  }
}
