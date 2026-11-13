import { pointsAtThisComputer } from "@/db/database-address";
import { type Stage, stageOf } from "@/settings";

const SAMPLE_DATA_STAGES: readonly Stage[] = [
  "local",
  "pr-preview",
  "main-preview",
  "render-preview",
];

/** The name of the preview's app in `render.yaml`. */
const RENDER_PREVIEW_SERVICE = "medali-preview";

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
  MEDALI_RENDER_PREVIEW?: string | undefined;
  RENDER?: string | undefined;
  RENDER_SERVICE_NAME?: string | undefined;
  DATABASE_URL?: string | undefined;
}

/**
 * Whether Render says this is the preview's own app. Render gives every
 * app its name, so the app of medali.site never says this.
 */
function isRenderPreviewApp(env: StartupEnv): boolean {
  return (
    env.RENDER === "true" && env.RENDER_SERVICE_NAME === RENDER_PREVIEW_SERVICE
  );
}

/**
 * Refuses to start with Ganti peran on unless a second sign agrees with the
 * stage: a preview at Vercel must really run on Vercel, the preview at
 * Render must be the app Render names medali-preview, and a local run must
 * use a database on this computer. Otherwise a stray setting on the campus
 * server could open every account to anyone.
 */
export function checkSwitcherAtStartup(env: StartupEnv): void {
  const stage = stageOf(env);
  if (!accountSwitcherOn(stage)) return;
  const atVercel = stage === "pr-preview" || stage === "main-preview";
  if (atVercel && env.VERCEL !== "1") {
    throw new Error(
      `Ganti peran is on for ${stage}, but the app is not running on Vercel; refused to start.`,
    );
  }
  if (stage === "render-preview" && !isRenderPreviewApp(env)) {
    throw new Error(
      `Ganti peran is on for render-preview, but the app is not Render's ${RENDER_PREVIEW_SERVICE}; refused to start.`,
    );
  }
  if (stage === "local" && !pointsAtThisComputer(env.DATABASE_URL)) {
    throw new Error(
      "Ganti peran is on for a local run, but the database is not on this computer; refused to start.",
    );
  }
}
