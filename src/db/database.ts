import { currentStage, readSetting } from "@/settings";
import { appConnectionOf } from "./app-connection";
import { type Connection, connect } from "./connect";

const shared = globalThis as { medaliConnection?: Connection };

/**
 * The app's one connection. It is kept on `globalThis` because the dev
 * server reloads modules on every edit, and each reload would otherwise
 * open a new pool.
 */
export function database() {
  shared.medaliConnection ??= connectApp();
  return shared.medaliConnection.db;
}

function connectApp(): Connection {
  const app = appConnectionOf(readSetting("DATABASE_URL"), currentStage());
  return connect(app.url, app.limits);
}
